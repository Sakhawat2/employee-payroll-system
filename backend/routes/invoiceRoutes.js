const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const {
  createInvoice,
  getInvoices,
  updateInvoiceStatus,
  deleteInvoice,
} = require("../controllers/invoiceController");

// Create new invoice
router.post("/", verifyToken, createInvoice);

// Get all invoices (admin sees all, employee sees their own)
router.get("/", verifyToken, getInvoices);

// Update only invoice status
router.put("/:id/status", verifyToken, updateInvoiceStatus);

// Delete invoice (admin only)
router.delete("/:id", verifyToken, deleteInvoice);

module.exports = router;
