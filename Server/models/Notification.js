const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

const notification = mongoose.model("notification", notificationSchema);

module.exports = notification;
