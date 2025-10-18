const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const WorkRecord = require('../models/WorkRecord');
const Payroll = require('../models/Payroll');

// Dummy middleware for testing (replace with real auth later)
function verifyToken(req, res, next) {
  req.user = { id: 'EMP001' }; // Use string-based employeeId now
  next();
}

/* ======================================
   🔹 GET all employees
====================================== */
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/* ======================================
   🔹 GET single employee by MongoDB _id
====================================== */
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    res.json(employee);
  } catch (err) {
    console.error("❌ Error fetching employee:", err);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

/* ======================================
   🔹 POST add new employee with auto-generated EMP ID
====================================== */
router.post('/', async (req, res) => {
  try {
    const count = await Employee.countDocuments();
    const nextId = `EMP${String(count + 1).padStart(3, '0')}`; // e.g. EMP001

    const { name, email, phone, address, role, password } = req.body;

    const newEmployee = new Employee({
      employeeId: nextId,
      name,
      email,
      phone,
      address,
      role,
      password
    });

    const saved = await newEmployee.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error creating employee:", err);
    res.status(400).json({ error: 'Failed to create employee', details: err.message });
  }
});

/* ======================================
   🔹 PUT update employee by _id
====================================== */
router.put('/:id', async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

/* ======================================
   🔹 GET work records for logged-in employee
====================================== */
router.get('/work-records', verifyToken, async (req, res) => {
  try {
    const records = await WorkRecord.find({ employeeId: req.user.id });
    res.json(records);
  } catch (err) {
    console.error("❌ Error fetching work records:", err);
    res.status(500).json({ error: 'Failed to fetch work records' });
  }
});

/* ======================================
   🔹 GET payroll summary for logged-in employee
====================================== */
router.get('/payroll', verifyToken, async (req, res) => {
  try {
    const payroll = await Payroll.findOne({ employeeId: req.user.id });
    res.json(payroll || { message: "No payroll record found" });
  } catch (err) {
    console.error("❌ Error fetching payroll:", err);
    res.status(500).json({ error: 'Failed to fetch payroll summary' });
  }
});

module.exports = router;
