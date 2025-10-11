const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  schedule: Object,
  password: String
});

module.exports = mongoose.model('Employee', EmployeeSchema);
