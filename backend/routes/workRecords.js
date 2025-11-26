const express = require("express");
const router = express.Router();
const WorkRecord = require("../models/WorkRecord");
const verifyToken = require("../middleware/auth");

/* ======================================
   🔹 GET all or filtered work records
   Admin → all records
   Employee → only their own
====================================== */
router.get("/", verifyToken, async (req, res) => {
  try {
    const { employee, date } = req.query;
    const query = {};

    // Admin can filter any employee
    if (req.user.role === "admin") {
      if (employee) query.employeeId = employee;
    } else {
      query.employeeId = req.user.employeeId;
    }

    if (date) query.date = date;

    console.log("🔍 Querying WorkRecords:", query);
    const records = await WorkRecord.find(query).sort({ date: 1 });
    res.json(records);
  } catch (err) {
    console.error("❌ Error fetching work records:", err);
    res.status(500).json({ error: "Failed to fetch work records" });
  }
});

/* ======================================
   🔹 POST new work record
   Employee → can add only their own
   Admin → can add for anyone
====================================== */
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      date,
      startTime,
      endTime,
      hours,
      status,
    } = req.body;

    const newRecord = new WorkRecord({
      employeeId: req.user.role === "admin" ? employeeId : req.user.employeeId,
      employeeName: req.user.role === "admin" ? employeeName : req.user.name,
      date,
      startTime, // ⬅️ added
      endTime,   // ⬅️ added
      hours,
      status: status || "pending",
    });

    const saved = await newRecord.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error creating work record:", err);
    res
      .status(400)
      .json({ error: "Failed to create work record", details: err.message });
  }
});

/* ======================================
   🔹 PUT update work record
   Admin → any record
   Employee → only their own
====================================== */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const record = await WorkRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Work record not found" });

    if (req.user.role !== "admin" && record.employeeId !== req.user.employeeId)
      return res.status(403).json({ error: "Access denied" });

    const { date, startTime, endTime, hours, status } = req.body;
    record.date = date || record.date;
    record.startTime = startTime || record.startTime;
    record.endTime = endTime || record.endTime;
    record.hours = hours || record.hours;
    record.status = status || record.status;

    const updated = await record.save();
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating work record:", err);
    res.status(400).json({ error: "Failed to update work record" });
  }
});

/* ======================================
   🔹 PUT update only status
   Admin → allowed
   Employee → not allowed
====================================== */
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Only admins can update status" });

    const updated = await WorkRecord.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating status:", err);
    res.status(400).json({ error: "Failed to update status" });
  }
});

/* ======================================
   🔹 DELETE work record
   Admin → any record
   Employee → only their own if not approved
====================================== */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const record = await WorkRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Work record not found" });

    // ✅ Admin can delete any record
    if (req.user.role === "admin") {
      await WorkRecord.findByIdAndDelete(req.params.id);
      return res.json({ message: "Work record deleted successfully" });
    }

    // ✅ Employee can delete only their own and only if not approved
    if (
      req.user.role === "employee" &&
      record.employeeId === req.user.employeeId &&
      record.status !== "approved"
    ) {
      await WorkRecord.findByIdAndDelete(req.params.id);
      return res.json({ message: "Work record deleted successfully" });
    }

    return res
      .status(403)
      .json({ error: "Access denied for this operation" });
  } catch (err) {
    console.error("❌ Error deleting work record:", err);
    res.status(500).json({ error: "Failed to delete work record" });
  }
});

/* ======================================
   🔹 NEW: Fetch records for a specific month
   Safe, isolated, only for MyPayroll
====================================== */
router.get("/by-month", verifyToken, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ error: "Month (YYYY-MM) is required" });
    }

    const query = {
      date: { $regex: `^${month}` },
    };

    // Limit employees
    if (req.user.role === "employee") {
      query.employeeId = req.user.employeeId;
    }

    const records = await WorkRecord.find(query).sort({ date: 1 });
    res.json(records);
  } catch (err) {
    console.error("❌ Error fetching monthly records:", err);
    res.status(500).json({ error: "Failed to fetch records by month" });
  }
});


module.exports = router;
