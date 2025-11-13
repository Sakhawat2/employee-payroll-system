const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const mongoose = require("mongoose");
const Employee = require("../models/Employee");

// 📘 Schema
const holidaySchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeName: String,
    status: { type: String, default: "Pending" },
    type: { type: String, required: true },
    year: String,
    startDate: String,
    endDate: String,
    notes: String,
    duration: Number,
    usedSaturdays: Number,
    approval: { type: String, default: "Pending" },
  },
  { timestamps: true }
);
const Holiday = mongoose.model("Holiday", holidaySchema);

// ✅ Helper: Get ObjectId from employeeId or code
const getEmployeeObjectId = async (idOrCode) => {
  if (mongoose.isValidObjectId(idOrCode)) return idOrCode;
  const emp = await Employee.findOne({ employeeId: idOrCode });
  return emp ? emp._id : null;
};

/* ============================================================
   🔹 GET holidays (Admin → any employee / Employee → self)
============================================================ */
router.get("/", verifyToken, async (req, res) => {
  try {
    const { employeeId } = req.query;
    let query = {};

    if (req.user.role === "admin") {
      // ✅ Admin can filter any employee or see all
      if (employeeId) {
        const empObjId = await getEmployeeObjectId(employeeId);
        if (empObjId) query.employeeId = empObjId;
      }
    } else {
      // ✅ Employees see only their own holidays
      query.employeeId = req.user._id;
    }

    const holidays = await Holiday.find(query)
      .populate("employeeId", "name employeeId email role")
      .sort({ createdAt: -1 });

    res.json(holidays);
  } catch (err) {
    console.error("❌ Error fetching holidays:", err);
    res.status(500).json({ error: "Failed to fetch holidays" });
  }
});

/* ============================================================
   🔹 POST new holiday (Admin or Employee)
============================================================ */
router.post("/", verifyToken, async (req, res) => {
  try {
    const empObjId = await getEmployeeObjectId(req.body.employeeId || req.user._id);
    if (!empObjId) return res.status(400).json({ error: "Invalid employee reference" });

    const newHoliday = new Holiday({
      employeeId: empObjId,
      employeeName: req.body.employeeName || req.user.name,
      type: req.body.type,
      status: req.body.status || "Pending",
      year: req.body.year,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      notes: req.body.notes,
      approval: req.body.approval || "Pending",
    });

    const saved = await newHoliday.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error adding holiday:", err);
    res.status(400).json({ error: "Failed to add holiday", details: err.message });
  }
});

/* ============================================================
   🔹 PUT update holiday (Admin or Owner)
============================================================ */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) return res.status(404).json({ error: "Holiday not found" });

    if (req.user.role !== "admin" && String(holiday.employeeId) !== req.user._id)
      return res.status(403).json({ error: "Access denied" });

    Object.assign(holiday, req.body);
    const updated = await holiday.save();
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating holiday:", err);
    res.status(500).json({ error: "Failed to update holiday" });
  }
});

/* ============================================================
   🔹 DELETE holiday (Admin only)
============================================================ */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: "Holiday deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting holiday:", err);
    res.status(500).json({ error: "Failed to delete holiday" });
  }
});

module.exports = router;
