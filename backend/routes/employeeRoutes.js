const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const Employee = require("../models/Employee");

// ==============================================
// 🔹 GET all employees (Admin only)
// ==============================================
router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied" });

    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// ==============================================
// 🔹 GET single employee (Admin or Self)
// ==============================================
router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.id)
      return res.status(403).json({ error: "Access denied" });

    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // ✅ Flatten nested data for frontend
    const response = {
      _id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      role: employee.role,
      citizenship: employee.citizenship,
      bankInfo: employee.bankInfo || {},
      ...employee.employmentInfo,
    };

    res.json(response);
  } catch (err) {
    console.error("❌ Error fetching employee:", err);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

// ==============================================
// 🔹 PUT update employee (Admin or Self)
// ==============================================
router.put("/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.id)
      return res.status(403).json({ error: "Access denied" });

    const update = { ...req.body };

    // ✅ Keep nested structure consistent
    if (req.body.bankInfo) update.bankInfo = req.body.bankInfo;
    if (req.body.employmentInfo || req.body.jobTitle) {
      update.employmentInfo = {
        ...(req.body.employmentInfo || {}),
        jobTitle: req.body.jobTitle,
        contractType: req.body.contractType,
        workingHours: req.body.workingHours,
        hourlyRate: req.body.hourlyRate,
      };
    }

    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Employee not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating employee:", err);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

module.exports = router;
