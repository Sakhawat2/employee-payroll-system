const express = require('express');
const router = express.Router();
const WorkRecord = require('../models/WorkRecord');

// Dummy middleware for testing
function verifyToken(req, res, next) {
  req.user = { id: '1234567890' }; // Replace with real user ID later
  next();
}

// GET work records
router.get('/', verifyToken, async (req, res) => {
  try {
    const records = await WorkRecord.find({ employeeId: req.user.id });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch work records' });
  }
});

// POST new work record
router.post('/', verifyToken, async (req, res) => {
  try {
    const newRecord = new WorkRecord({
      employeeId: req.user.id,
      date: req.body.date,
      hours: req.body.hours,
      status: req.body.status
    });
    const saved = await newRecord.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create work record' });
  }
});

module.exports = router;
