const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const verifyToken = require("../middleware/auth");
const router = express.Router();

/* ======================================
   🔹 POST /api/auth/login
   Authenticate user and return JWT
====================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔹 Find employee by email
    const user = await Employee.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 🔹 Compare password (plain-text for now)
    const isMatch = password === user.password;
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 🔹 Create JWT token (include MongoDB _id)
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ FIX: Send `_id` instead of `id`
    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id, // 👈 Important fix
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

/* ===========================================
   🔒 Change Password (Authenticated User)
=========================================== */
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new passwords are required" });
    }

    // Find user by ID from token
    const user = await Employee.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error changing password:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

/* ===========================================
   🔹 GET /api/auth/profile
   Fetch logged-in user profile
=========================================== */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await Employee.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

module.exports = router;
