// backend/routes/employees.js
const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const WorkRecord = require("../models/WorkRecord");
const Payroll = require("../models/Payroll");
const verifyToken = require("../middleware/auth");

/* ======================================
   🔹 GET all employees (Admin only)
====================================== */
router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied: Admin only" });
    }

    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

/* ======================================
   🔹 GET single employee (Admin OR Self)
====================================== */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const targetId = req.params.id;
    const requesterId = req.user.id; // consistent usage

    if (req.user.role !== "admin" && requesterId !== targetId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const employee = await Employee.findById(targetId).lean();
    if (!employee)
      return res.status(404).json({ error: "Employee not found" });

    if (!employee.bankInfo) employee.bankInfo = {};
    if (!employee.employmentInfo) employee.employmentInfo = {};

    res.json(employee);
  } catch (err) {
    console.error("❌ Error fetching employee:", err);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

/* ======================================
   🔹 POST add new employee (Admin only)
====================================== */
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied: Admin only" });
    }

    const count = await Employee.countDocuments();
    const nextId = `EMP${String(count + 1).padStart(3, "0")}`;

    const { name, email, phone, address, role, password } = req.body;

    const newEmployee = new Employee({
      employeeId: nextId,
      name,
      email,
      phone,
      address,
      role,
      password,
    });

    const saved = await newEmployee.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error creating employee:", err);
    res
      .status(400)
      .json({ error: "Failed to create employee", details: err.message });
  }
});

/* ======================================
   🔹 PUT update employee (Admin or Self)
====================================== */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const targetId = req.params.id;

    if (req.user.role !== "admin" && requesterId !== targetId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await Employee.findByIdAndUpdate(
      targetId,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

/* ==========================================
   🔹 EMPLOYEE SELF-UPDATE (Personal + Bank)
========================================== */
router.put("/:id/self-update", verifyToken, async (req, res) => {
  try {
    const requesterId = req.user.id;
    const targetId = req.params.id;

    if (requesterId !== targetId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const personal = {};
    const bankInfo = {};

    const allowedPersonal = ["name", "phone", "address", "citizenship"];

    allowedPersonal.forEach((f) => {
      if (req.body[f] !== undefined) personal[f] = req.body[f];
    });

    if (req.body.bankInfo) {
      ["bankName", "accountNumber", "iban", "paymentMethod"].forEach((f) => {
        if (req.body.bankInfo[f] !== undefined)
          bankInfo[f] = req.body.bankInfo[f];
      });
    }

    const update = {};
    if (Object.keys(personal).length > 0) update.$set = personal;
    if (Object.keys(bankInfo).length > 0)
      update.$set = { ...update.$set, bankInfo };

    const updated = await Employee.findByIdAndUpdate(targetId, update, {
      new: true,
    });

    res.json(updated);
  } catch (err) {
    console.error("Self update error:", err);
    res.status(500).json({ error: "Failed to update" });
  }
});

/* ======================================
   🔹 DELETE employee (Admin only)
====================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied: Admin only" });

    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting employee:", err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

/* ======================================
   🔹 GET logged-in user's work records
====================================== */
router.get("/work-records", verifyToken, async (req, res) => {
  try {
    const records = await WorkRecord.find({
      employeeId: req.user.employeeId,
    });
    res.json(records);
  } catch (err) {
    console.error("❌ Error fetching work records:", err);
    res.status(500).json({ error: "Failed to fetch work records" });
  }
});

/* ======================================
   🔹 GET payroll summary for logged-in user
====================================== */
router.get("/payroll", verifyToken, async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      employeeId: req.user.employeeId,
    });
    res.json(payroll || { message: "No payroll record found" });
  } catch (err) {
    console.error("❌ Error fetching payroll:", err);
    res.status(500).json({ error: "Failed to fetch payroll summary" });
  }
});

module.exports = router;
