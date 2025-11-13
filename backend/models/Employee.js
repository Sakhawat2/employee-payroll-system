const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    address: String,
    role: { type: String, enum: ["admin", "employee"], default: "employee" },

    // 👤 Personal Info
    personalId: String,
    dob: String,
    gender: String,
    citizenship: String,

    // 🏦 Bank Info
    bankInfo: {
      bankName: String,
      accountNumber: String,
      iban: String,
      paymentMethod: String,
    },

    // 💼 Employment Info
    employmentInfo: {
      validFrom: String,
      startDate: String,
      location: String,
      jobTitle: String,
      probationEnd: String,
      contractType: String,
      workingType: String,
      paymentGroup: String,
      employeeGroup: String,
      agreement: String,
      workingHours: String,
      workingPercent: String,
      actualHours: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
