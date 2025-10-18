const express = require('express');
const router = express.Router();
const WorkRecord = require('../models/WorkRecord');

// Dummy middleware for testing
function verifyToken(req, res, next) {
  req.user = { id: 'EMP001' }; // Replace with real ID after authentication
  next();
}

// 🔹 GET all or filtered work records
router.get('/', verifyToken, async (req, res) => {
  try {
    const { employee, date } = req.query;
    const query = {};

    if (employee) query.employeeId = employee; // string-based
    if (date) query.date = date;

    console.log("🔍 Querying WorkRecords:", query);
    const records = await WorkRecord.find(query);
    res.json(records);
  } catch (err) {
    console.error("❌ Error fetching work records:", err);
    res.status(500).json({ error: 'Failed to fetch work records', details: err.message });
  }
});

// 🔹 POST new work record
router.post('/', verifyToken, async (req, res) => {
  try {
    const newRecord = new WorkRecord({
      employeeId: req.body.employeeId || req.user.id,
      employeeName: req.body.employeeName || 'Unknown',
      date: req.body.date,
      hours: req.body.hours,
      status: req.body.status || 'pending'
    });

    const saved = await newRecord.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error creating work record:", err);
    res.status(400).json({ error: 'Failed to create work record', details: err.message });
  }
});

// 🔹 PUT update work record
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updated = await WorkRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update work record' });
  }
});

// 🔹 PUT update only status
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const updated = await WorkRecord.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update status' });
  }
});

// GET /api/work-records?employeeId=EMP001&month=2025-10
router.get("/", async (req, res) => {
  try {
    const { employeeId, month } = req.query;
    const query = {};

    if (employeeId) query.employeeId = employeeId;
    if (month) {
      const [year, mon] = month.split("-");
      const start = new Date(`${year}-${mon}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      query.date = { $gte: start, $lt: end };
    }

    console.log("🔍 Querying WorkRecords:", query);

    const records = await WorkRecord.find(query);
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching work records");
  }
});



module.exports = router;
