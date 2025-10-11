const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  basic: { type: Number, required: true },
  deductions: { type: Number, default: 0 },
  net: { type: Number, required: true },
  month: { type: String }, // optional: e.g. "October 2025"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payroll', payrollSchema);
