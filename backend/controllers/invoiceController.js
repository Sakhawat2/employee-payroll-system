const Invoice = require("../models/Invoice");
const Employee = require("../models/Employee");

// Create invoice
exports.createInvoice = async (req, res) => {
  try {
    const { invoiceNumber, employeeId, month, amount, description } = req.body;

    if (!invoiceNumber || !employeeId || !month || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emp = await Employee.findOne({ employeeId });
    if (!emp) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const invoice = new Invoice({
      invoiceNumber,
      employeeId,
      employeeName: emp.name,
      month,
      amount,
      description,
      status: "unpaid"
    });

    const saved = await invoice.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(500).json({ error: "Failed to create invoice" });
  }
};


// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices =
      req.user.role === "admin"
        ? await Invoice.find().sort({ createdAt: -1 })
        : await Invoice.find({ employeeId: req.user.employeeId });

    res.json(invoices);
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};


// Update status only
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["paid", "unpaid"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updated = await Invoice.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error updating invoice:", err);
    res.status(500).json({ error: "Failed to update invoice status" });
  }
};


// Delete invoice (Admin Only)
exports.deleteInvoice = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete invoices" });
    }

    const deleted = await Invoice.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error("Error deleting invoice:", err);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
};
