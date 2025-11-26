const mongoose = require("mongoose");

// -------------------------------
// Finnish IBAN & BIC validation
// -------------------------------
const finnishIbanRegex = /^FI\d{14,16}$/; // FI + 14–16 digits (banks vary)
const bicRegex = /^[A-Z0-9]{8}([A-Z0-9]{3})?$/;

const employeeSchema = new mongoose.Schema(
  {
    // ---------------------------------
    // BASIC & LOGIN INFO
    // ---------------------------------
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    phone: String,
    address: String,

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },

    // ---------------------------------
    // PERSONAL INFORMATION
    // ---------------------------------
    personalId: String,        // HETU (not validated here)
    dob: String,               // ISO format or string
    gender: String,
    citizenship: String,

    // ---------------------------------
    // BANKING (SEPA COMPATIBLE)
    // ---------------------------------
    bankInfo: {
      bankName: { type: String },
      accountNumber: { type: String },

      iban: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true; // Optional → backward compatible
            const clean = v.replace(/\s+/g, "").toUpperCase();
            return finnishIbanRegex.test(clean);
          },
          message: "Invalid Finnish IBAN format",
        },
      },

      bic: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true; // Optional for domestic payments
            return bicRegex.test(v.toUpperCase());
          },
          message: "Invalid BIC/SWIFT code",
        },
      },

      paymentMethod: String, // SEPA, Bank Transfer, Cash
    },

    // ---------------------------------
    // EMPLOYMENT DETAILS
    // ---------------------------------
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

      hourlyRate: {
        type: Number,
        default: 15, // default from your Settings.jsx
      },

      salaryReference: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
