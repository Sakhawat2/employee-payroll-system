const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const verifyToken = require("../middleware/auth");
const Employee = require("../models/Employee");
const PDFDocument = require("pdfkit");

// Auto-generate invoice numbers: INV-2025-1234
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${rand}`;
}

/**
 * CREATE INVOICE
 * Simple, single-item invoice for employee bonus/allowance
 * VAT is effectively 0% (no VAT added to total)
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { employeeId, month, amount, description } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: "employeeId is required" });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      return res.status(400).json({ error: "amount must be a number" });
    }

    // Find employee
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Single item, VAT = 0% (shown but not added)
    const items = [
      {
        description: description || "Payroll invoice",
        quantity: 1,
        rate: numericAmount,
        vat: 0, // 0% VAT for employee bonus/allowance
        total: numericAmount,
      },
    ];

    const total = items.reduce((sum, i) => sum + (i.total || 0), 0);

    const now = new Date();
    const issueDate = now.toISOString().slice(0, 10);
    const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const invoiceNumber = generateInvoiceNumber();

    const invoice = new Invoice({
      invoiceNumber,
      employeeId,
      employeeName: employee.name,
      month: month || "",
      issueDate,
      dueDate,
      items,
      total,
      notes: description || "",
    });

    const savedInvoice = await invoice.save();
    res.json(savedInvoice);
  } catch (err) {
    console.error("Invoice creation error:", err);
    res.status(500).json({ error: "Server error while creating invoice" });
  }
});

// GET ALL INVOICES
router.get("/", verifyToken, async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    console.error("Fetch invoice error:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// GET EMPLOYEE INVOICES
router.get("/employee/:id", verifyToken, async (req, res) => {
  try {
    const invoices = await Invoice.find({ employeeId: req.params.id });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employee invoices" });
  }
});

// UPDATE STATUS (paid / unpaid / cancelled)
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: "Failed to update invoice status" });
  }
});

// DELETE INVOICE
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

// DOWNLOAD INVOICE AS PDF (Finnish-style, VAT shown but not added)
router.get("/:id/pdf", verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Employee can only see their own invoices
    if (
      req.user.role === "employee" &&
      invoice.employeeId !== req.user.employeeId
    ) {
      return res.status(403).json({ error: "Not allowed to view this invoice" });
    }

    // Company info (can later move to config/env)
    const company = {
      name: "Centria Payroll Systems Oy",
      address: "Niemenkatu 10 B",
      city: "68600 Pietarsaari, Finland",
      businessId: "FI-1234567-8",
      iban: "FI00 1234 5600 0007 85",
      bic: "NDEAFIHH",
    };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice_${invoice.invoiceNumber || invoice._id}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(res);

    // ---------- HEADER ----------
    doc.fontSize(18).font("Helvetica-Bold").text(company.name, 50, 50);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(company.address, 50, 75)
      .text(company.city, 50, 90)
      .text(`Business ID (Y-tunnus): ${company.businessId}`, 50, 105);

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 50);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice No: ${invoice.invoiceNumber || "-"}`, 400, 80)
      .text(`Issue Date: ${invoice.issueDate || "-"}`, 400, 95)
      .text(`Due Date: ${invoice.dueDate || "-"}`, 400, 110)
      .text(`Reference: ${invoice._id.toString().slice(-8)}`, 400, 125);

    // ---------- BILL TO ----------
    doc
      .moveDown()
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Bill To:", 50, 150);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(invoice.employeeName || "-", 50, 170)
      .text(`Employee ID: ${invoice.employeeId}`, 50, 185);

    if (invoice.month) {
      doc.text(`Period: ${invoice.month}`, 50, 200);
    }

    // ---------- ITEMS TABLE ----------
    const startY = 240;
    doc.moveTo(50, startY - 10).lineTo(550, startY - 10).stroke();

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Description", 50, startY)
      .text("Qty", 280, startY, { width: 50, align: "right" })
      .text("Rate", 340, startY, { width: 70, align: "right" })
      .text("VAT %", 420, startY, { width: 50, align: "right" })
      .text("Total (€)", 480, startY, { width: 70, align: "right" });

    doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();

    let y = startY + 25;
    let subtotal = 0;
    let totalVat = 0;

    const items =
      Array.isArray(invoice.items) && invoice.items.length > 0
        ? invoice.items
        : [
            {
              description: invoice.notes || "Payroll invoice",
              quantity: 1,
              rate: invoice.total || 0,
              vat: 0,
              total: invoice.total || 0,
            },
          ];

    items.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const vatPercent = Number(item.vat) || 0; // 0% in our case
      const total = Number(item.total) || 0;

      // For employee invoices: VAT is effectively 0, but we still calculate generically
      const base = qty * rate;
      const vatAmount = total - base; // will be 0 if total === base

      subtotal += base;
      totalVat += vatAmount;

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(item.description || "-", 50, y, { width: 220 })
        .text(qty.toString(), 280, y, { width: 50, align: "right" })
        .text(rate.toFixed(2), 340, y, { width: 70, align: "right" })
        .text(vatPercent.toFixed(1), 420, y, { width: 50, align: "right" })
        .text(total.toFixed(2), 480, y, { width: 70, align: "right" });

      y += 18;
      if (y > 700) {
        doc.addPage();
        y = 100;
      }
    });

    doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke();

    const grandTotal = invoice.total || subtotal + totalVat;

    y += 20;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Subtotal (no VAT):", 380, y, { width: 120, align: "right" })
      .text(subtotal.toFixed(2), 510, y, { width: 60, align: "right" });

    y += 15;
    doc
      .font("Helvetica-Bold")
      .text("VAT total:", 380, y, { width: 120, align: "right" })
      .text(totalVat.toFixed(2), 510, y, { width: 60, align: "right" });

    y += 15;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("TOTAL:", 380, y, { width: 120, align: "right" })
      .text(grandTotal.toFixed(2) + " €", 510, y, { width: 60, align: "right" });

    // ---------- PAYMENT INFO ----------
    y += 40;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Payment Information", 50, y);

    y += 18;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`IBAN: ${company.iban}`, 50, y)
      .text(`BIC: ${company.bic}`, 50, y + 15)
      .text(
        `Reference number: ${invoice._id.toString().slice(-8)}`,
        50,
        y + 30
      )
      .text(
        `Please pay the invoice by the due date. Include the reference number in the payment details.`,
        50,
        y + 50,
        { width: 500 }
      );

    // Notes
    if (invoice.notes) {
      y += 90;
      doc.fontSize(10).font("Helvetica-Bold").text("Notes", 50, y);
      y += 15;
      doc.font("Helvetica").text(invoice.notes, 50, y, { width: 500 });
    }

    // Footer
    doc
      .fontSize(9)
      .fillColor("#777")
      .text(
        `${company.name} • ${company.address}, ${company.city} • Business ID: ${company.businessId}`,
        50,
        780,
        { width: 500, align: "center" }
      );

    doc.end();
  } catch (err) {
    console.error("Error generating invoice PDF:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate invoice PDF" });
    }
  }
});

module.exports = router;
