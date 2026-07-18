const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // was `URL` - lowercased for JS-convention consistency
    fileName: { type: String },
    mimeType: { type: String },
    size: { type: Number },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true },

    // Optional, situational links - an attachment belongs to at most one of these.
    task: { type: mongoose.Schema.Types.ObjectId, ref: "task" },
    chapterSubmission: { type: mongoose.Schema.Types.ObjectId, ref: "chapter_submission" },
    message: { type: mongoose.Schema.Types.ObjectId, ref: "message" },
  },
  { timestamps: true } // replaces the manual uploadedAt field
);

const attachment = mongoose.model("attachment", attachmentSchema);

module.exports = attachment;
