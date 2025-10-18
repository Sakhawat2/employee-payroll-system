const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// ✅ Get all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ✅ Add a new notification
router.post("/", async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ error: "Notification text required" });

    const newNotification = new Notification({ text, type });
    await newNotification.save();

    res.status(201).json(newNotification);
  } catch (err) {
    console.error("Error adding notification:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

// ✅ Mark a notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// ✅ Delete notification
router.delete("/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

module.exports = router;
