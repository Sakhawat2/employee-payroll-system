const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: String,
    type: String,
    startDate: String,
    endDate: String,
    notes: String,
    approval: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Holiday", holidaySchema);
