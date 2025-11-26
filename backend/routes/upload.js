const express = require("express");
const multer = require("multer");
const verifyToken = require("../middleware/auth");
const Employee = require("../models/Employee");
const router = express.Router();

// storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// Upload profile image
router.post(
  "/profile/:id",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.id !== req.params.id) {
        return res.status(403).json({ error: "Not allowed" });
      }

      const filePath = "/uploads/" + req.file.filename;

      const updated = await Employee.findByIdAndUpdate(
        req.params.id,
        { profileImage: filePath },
        { new: true }
      );

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

module.exports = router;
