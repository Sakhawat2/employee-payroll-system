// routes/payments.js
const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");

// 🔹 Create new payment record (mark as paid)
router.post("/", async (req, res) => {
  try {
    const { employeeId, employeeName, month, totalHours, totalPay, ratePerHour } = req.body;
    const payment = new Payment({
      employeeId,
      employeeName,
      month,
      totalHours,
      totalPay,
      ratePerHour,
      status: "paid",
      datePaid: new Date(),
    });
    const saved = await payment.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

// 🔹 Get all payments (or filter by month)
router.get("/", async (req, res) => {
  try {
    const { month } = req.query;
    const filter = month ? { month } : {};
    const payments = await Payment.find(filter);
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// 🔹 Update payment status
router.put("/:id/status", async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, datePaid: req.body.status === "paid" ? new Date() : null },
      { new: true }
    );
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update payment status" });
  }
});

module.exports = router;
