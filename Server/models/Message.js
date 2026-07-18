const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true }, // was missing entirely
    content: { type: String }, // was missing entirely - required unless there's an attachment

    chatType: { type: String, enum: ["Private", "Project Group"], required: true },

    // Exactly one of these is set, depending on chatType
    project: { type: mongoose.Schema.Types.ObjectId, ref: "project" }, // for "Project Group" chats
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "auth" }, // for "Private" chats

    attachment: { type: mongoose.Schema.Types.ObjectId, ref: "attachment" },

    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "auth" }], // for group chat read receipts
  },
  { timestamps: true }
);

messageSchema.pre("validate", function (next) {
  if (!this.content && !this.attachment) {
    this.invalidate("content", "A message needs content or an attachment");
  }
  if (this.chatType === "Project Group" && !this.project) {
    this.invalidate("project", "project is required for Project Group messages");
  }
  if (this.chatType === "Private" && !this.recipient) {
    this.invalidate("recipient", "recipient is required for Private messages");
  }
  next();
});

const message = mongoose.model("message", messageSchema);

module.exports = message;
