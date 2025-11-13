const express = require("express");
const router = express.Router();
const WorkRecord = require("../models/WorkRecord");
const Employee = require("../models/Employee");
const verifyToken = require("../middleware/auth"); // ✅ add auth

// 📅 GET payroll summary (Admin or self)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { month } = req.query; // e.g. "2025-10"

    // 🔍 Date filter
    let dateFilter = {};
    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      dateFilter = { date: { $gte: start, $lt: end } };
    }

    // 🧾 Restrict Employees to see only their own payroll
    if (req.user.role !== "admin") {
      dateFilter.employeeId = req.user.employeeId;
    }

    // 🧾 Get all work records
    const workRecords = await WorkRecord.find(dateFilter);

    // ⚙️ Group by employeeId
    const grouped = workRecords.reduce((acc, record) => {
      const { employeeId, employeeName, hours } = record;
      if (!acc[employeeId]) {
        acc[employeeId] = { employeeId, employeeName, totalHours: 0 };
      }
      acc[employeeId].totalHours += hours;
      return acc;
    }, {});

    const employees = await Employee.find();

    // 💰 Calculate payroll
    const payrollSummary = Object.values(grouped).map((emp) => {
      const employee = employees.find((e) => e.employeeId === emp.employeeId);
      const rate = employee?.hourlyRate || 15; // default €15/hr
      const totalPay = emp.totalHours * rate;
      return {
        employeeId: emp.employeeId,
        employeeName: emp.employeeName || employee?.name || "Unknown",
        totalHours: emp.totalHours,
        hourlyRate: rate,
        totalPay,
      };
    });

    res.json(payrollSummary);
  } catch (err) {
    console.error("❌ Error fetching payroll summary:", err);
    res.status(500).json({ error: "Failed to fetch payroll summary" });
  }
});

module.exports = router;
