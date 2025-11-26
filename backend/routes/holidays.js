const express = require("express");
const router = express.Router();
const Holiday = require("../models/Holiday");
const verifyToken = require("../middleware/auth");

// 👉 Admin sees all holidays, employee sees only own
router.get("/", verifyToken, async (req, res) => {
  try {
    const employeeId = req.query.employeeId;

    let holidays = [];

    if (req.user.role === "admin") {
      holidays = employeeId
        ? await Holiday.find({ employeeId })
        : await Holiday.find();
    } else {
      holidays = await Holiday.find({ employeeId: req.user.id });
    }

    res.json(holidays);
  } catch (err) {
    console.error("Error fetching holidays:", err);
    res.status(500).json({ error: "Failed to load holidays" });
  }
});

// CREATE
router.post("/", verifyToken, async (req, res) => {
  try {
    const holiday = new Holiday(req.body);
    const saved = await holiday.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: "Failed to save holiday" });
  }
});

// UPDATE (Admin OR owner)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const existing = await Holiday.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Not found" });

    if (
      req.user.role !== "admin" &&
      existing.employeeId.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const updated = await Holiday.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update holiday" });
  }
});

module.exports = router;
