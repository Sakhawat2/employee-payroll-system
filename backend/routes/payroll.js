const express = require("express");
const router = express.Router();
const WorkRecord = require("../models/WorkRecord");
const Employee = require("../models/Employee");
const verifyToken = require("../middleware/auth"); // ✅ add auth
const generateSepaXml = require("../utils/sepaGenerator");


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

// EMPLOYEE MONTHLY PAYROLL
router.get("/my", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Not allowed" });
    }

    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ error: "Month is required (YYYY-MM)" });
    }

    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const records = await WorkRecord.find({
      employeeId: req.user.employeeId,
      date: { $gte: start, $lt: end },
    });

    let totalHours = 0;
    records.forEach((r) => (totalHours += r.hours));

    const employee = await Employee.findOne({
      employeeId: req.user.employeeId,
    });

    const rate = employee?.hourlyRate || 15;
    const totalPay = rate * totalHours;

    res.json({
      employeeId: employee.employeeId,
      employeeName: employee.name,
      month: month,
      rate,
      totalHours,
      totalPay,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payroll" });
  }
});

// ==============================================================

// 🔹 Generate SEPA XML file for a given month (Admin only)

// ==============================================================
router.get("/sepa-file", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can export SEPA file" });
    }

    const { month, executionDate } = req.query; // month: "2025-11"
    if (!month) {
      return res
        .status(400)
        .json({ error: "Query param 'month' (YYYY-MM) is required" });
    }

    // salary execution date (payday) -> default = today
    const payDate =
      executionDate || new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    // 1) Load all work records for that month (all employees)
    const records = await WorkRecord.find({
      date: { $regex: `^${month}` }, // date is stored as "YYYY-MM-DD"
      status: "approved", // only approved records for bank file
    });

    if (!records.length) {
      return res
        .status(400)
        .json({ error: `No approved work records found for ${month}` });
    }

    // 2) Group hours by employeeId
    const grouped = records.reduce((acc, r) => {
      if (!acc[r.employeeId]) {
        acc[r.employeeId] = {
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          totalHours: 0,
        };
      }
      acc[r.employeeId].totalHours += r.hours || 0;
      return acc;
    }, {});

    const employeeIds = Object.keys(grouped);
    const employees = await Employee.find({ employeeId: { $in: employeeIds } });

    // 3) Build payment list (and check IBANs)
    const missingBank = [];
    const payments = [];

    employeeIds.forEach((empId) => {
      const sum = grouped[empId];
      const emp = employees.find((e) => e.employeeId === empId);

      if (!emp || !emp.iban) {
        missingBank.push(`${sum.employeeName} (${empId})`);
        return;
      }

      const rate = emp.hourlyRate || 15;
      const amount = (sum.totalHours || 0) * rate;

      if (amount <= 0) return;

      payments.push({
        employeeId: empId,
        name: emp.name || sum.employeeName || "Employee",
        iban: emp.iban,
        amount,
        remittance: `Salary ${month}`,
      });
    });

    if (!payments.length) {
      return res.status(400).json({
        error: "No employees with valid IBAN and positive amount.",
        missingBank,
      });
    }

    if (missingBank.length) {
      console.warn("Employees missing IBAN for SEPA:", missingBank);
    }

    // 4) Debtor (company) info from env or fallback
    const debtor = {
      name: process.env.COMPANY_NAME || "Demo Company Oy",
      iban: process.env.COMPANY_IBAN || "FI00 0000 0000 0000 00",
      bic: process.env.COMPANY_BIC || "NDEAFIHH", // example: Nordea
    };

    const messageId = `SAL-${month}-${Date.now()}`;

    const xml = generateSepaXml({
      debtor,
      payments,
      executionDate: payDate,
      messageId,
    });

    res.setHeader("Content-Type", "application/xml");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="sepa_${month}.xml"`
    );
    res.send(xml);
  } catch (err) {
    console.error("❌ Error generating SEPA file:", err);
    res.status(500).json({ error: "Failed to generate SEPA XML file" });
  }
});


module.exports = router;
