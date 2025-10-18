const mongoose = require('mongoose');

const workRecordSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },  // ✅ now string, not ObjectId
  employeeName: { type: String, required: true }, // ✅ keep this for clarity
  date: { type: String, required: true },
  hours: { type: Number, required: true },
  status: { type: String, required: true, default: "pending" }
});

module.exports = mongoose.models.WorkRecord || mongoose.model('WorkRecord', workRecordSchema);
