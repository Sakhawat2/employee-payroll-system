const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    time: { type: String, default: "Just now" },
    type: { type: String, enum: ["info", "warning", "success"], default: "info" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
