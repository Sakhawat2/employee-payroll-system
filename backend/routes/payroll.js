const express = require("express");
const router = express.Router();
const WorkRecord = require("../models/WorkRecord");
const Employee = require("../models/Employee");

// 📅 GET payroll summary
// Example: GET /api/payroll?month=2025-10
router.get("/", async (req, res) => {
  try {
    const { month } = req.query; // e.g. "2025-10"

    // 🔍 Build date filter if month provided
    let dateFilter = {};
    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      dateFilter = { date: { $gte: start, $lt: end } };
    }

    // 🧾 Get all work records (filtered by month if given)
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

    // 💰 Calculate payroll (total hours × hourly rate)
    const payrollSummary = Object.values(grouped).map((emp) => {
      const employee = employees.find((e) => e.employeeId === emp.employeeId);
      const rate = employee?.hourlyRate || 15; // default $15/hour if not defined
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
    console.error("Error fetching payroll summary:", err);
    res.status(500).json({ error: "Failed to fetch payroll summary" });
  }
});

module.exports = router;
