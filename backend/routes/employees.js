const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const WorkRecord = require('../models/WorkRecord');
const Payroll = require('../models/Payroll');

// Inline dummy verifyToken middleware
function verifyToken(req, res, next) {
  // Simulate a logged-in user for testing
  req.user = { id: '1234567890' }; // Replace with real user ID from token in production
  next();
}

// GET all employees (admin only)
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// PUT update profile
router.put('/:id', async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// GET work records for logged-in employee
router.get('/work-records', verifyToken, async (req, res) => {
  try {
    const records = await WorkRecord.find({ employeeId: req.user.id });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch work records' });
  }
});

// GET payroll summary for logged-in employee
router.get('/payroll', verifyToken, async (req, res) => {
  try {
    const payroll = await Payroll.findOne({ employeeId: req.user.id });
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payroll summary' });
  }
});

module.exports = router;
