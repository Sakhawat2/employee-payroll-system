const mongoose = require('mongoose');

const workRecordSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true },
  hours: { type: Number, required: true },
  status: { type: String, required: true }
});

module.exports = mongoose.models.WorkRecord || mongoose.model('WorkRecord', workRecordSchema);
