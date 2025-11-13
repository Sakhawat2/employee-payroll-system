const mongoose = require("mongoose");

const workRecordSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String },
    date: { type: String, required: true },
    startTime: { type: String },   // 🕒 Added
    endTime: { type: String },     // 🕒 Added
    hours: { type: Number, required: true },
    status: { type: String, default: "pending" }, // pending / approved / rejected
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkRecord", workRecordSchema);
