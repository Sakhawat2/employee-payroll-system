// models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  month: { type: String, required: true }, // format: YYYY-MM
  totalHours: Number,
  totalPay: Number,
  ratePerHour: Number,
  status: { type: String, enum: ["paid", "unpaid"], default: "unpaid" },
  datePaid: { type: Date }, // recorded when payment made
});

module.exports = mongoose.model("Payment", paymentSchema);
