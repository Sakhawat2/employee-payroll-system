// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");

dotenv.config();

// 🧠 Connect to MongoDB
connectDB();

const app = express();

// 🧩 Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Optional: logs requests for debugging

// 🛠 Routes
app.use("/api/employees", require("./routes/employeeRoutes")); // ✅ FIXED filename
app.use("/api/work-records", require("./routes/workRecords"));
app.use("/api/payroll", require("./routes/payroll"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/holidays", require("./routes/holidayRoutes")); // ✅ Keep as is
app.use("/api/invoices", require("./routes/invoices"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/password", require("./routes/password"));
app.use("/api/upload", require("./routes/upload"));
app.use("/uploads", express.static("uploads"));





// 🔥 Root endpoint
app.get("/", (req, res) => {
  res.send("✅ Payroll Management API is running...");
});

// ⚙️ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
