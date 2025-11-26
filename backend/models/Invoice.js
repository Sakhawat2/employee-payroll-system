const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },

    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },

    // Optional now — frontend sometimes sends empty value
    month: { type: String, default: "" },

    // Auto-filled if not provided
    issueDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },

    dueDate: {
      type: String,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 14); // 14-day due date
        return d.toISOString().split("T")[0];
      },
    },

    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        rate: { type: Number, required: true },
        vat: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],

    total: { type: Number, required: true },

    status: {
      type: String,
      enum: ["unpaid", "paid", "cancelled"],
      default: "unpaid",
    },

    notes: String,
  },
  { timestamps: true }
);

// ---------------------------------------------------
// AUTO-GENERATE INVOICE NUMBER
// Format: INV-2025-0001
// ---------------------------------------------------
invoiceSchema.pre("save", async function (next) {
  if (this.invoiceNumber) return next();

  const year = new Date().getFullYear();

  const lastInvoice = await mongoose
    .model("Invoice")
    .findOne({})
    .sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastInvoice && lastInvoice.invoiceNumber) {
    const parts = lastInvoice.invoiceNumber.split("-");
    const numberPart = parseInt(parts[2]);
    nextNumber = numberPart + 1;
  }

  this.invoiceNumber = `INV-${year}-${String(nextNumber).padStart(4, "0")}`;
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
