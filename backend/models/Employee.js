const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true }, // e.g. EMP001
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  schedule: Object,
  password: { type: String, required: true }
});

module.exports = mongoose.model('Employee', employeeSchema);
