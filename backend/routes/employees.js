// backend/routes/employees.js
const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const WorkRecord = require("../models/WorkRecord");
const Payroll = require("../models/Payroll");
const verifyToken = require("../middleware/auth"); // ✅ Must properly decode JWT

/* ======================================
   🔹 GET all employees (Admin only)
====================================== */
router.get("/", verifyToken, async (req, res) => {
  try {
    // Make sure middleware adds req.user.role
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
   🔹 GET single employee (Admin or self)
====================================== */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Only Admin or self can view
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // Ensure nested objects exist so frontend doesn’t crash
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
   🔹 PUT update employee (Admin or self)
====================================== */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

/* ======================================
   🔹 DELETE employee (Admin only)
====================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied: Admin only" });
    }

    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting employee:", err);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

/* ======================================
   🔹 GET work records for logged-in user
====================================== */
router.get("/work-records", verifyToken, async (req, res) => {
  try {
    const records = await WorkRecord.find({ employeeId: req.user.employeeId });
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
    const payroll = await Payroll.findOne({ employeeId: req.user.employeeId });
    res.json(payroll || { message: "No payroll record found" });
  } catch (err) {
    console.error("❌ Error fetching payroll:", err);
    res.status(500).json({ error: "Failed to fetch payroll summary" });
  }
});

module.exports = router;
