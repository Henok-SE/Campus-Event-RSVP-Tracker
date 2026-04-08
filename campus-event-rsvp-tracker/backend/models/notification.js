const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["info", "success", "warning", "reminder"],
    default: "info"
  },
  title: {
    type: String,
    trim: true,
    default: "Notification"
  },
  message: {
    type: String,
    trim: true,
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

notificationSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model("Notification", notificationSchema);