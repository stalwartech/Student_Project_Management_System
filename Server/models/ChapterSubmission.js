const mongoose = require("mongoose");

const chapterSubmissionSchema = new mongoose.Schema(
  {
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "chapter", required: true },
    PDFFile: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },

    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true }, // was missing `ref`
    submittedAt: { type: Date, default: Date.now },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revision_requested"],
      default: "pending",
    },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
    reviewedAt: { type: Date },
    reviewComment: { type: String },
  },
  { timestamps: true }
);

const chapterSubmission = mongoose.model("chapter_submission", chapterSubmissionSchema);

module.exports = chapterSubmission;
