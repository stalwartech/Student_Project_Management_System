const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true },

    // Was `project_submission` referencing a model that doesn't exist anywhere
    // in the codebase - fixed to point at the actual submission model.
    chapterSubmission: { type: mongoose.Schema.Types.ObjectId, ref: "chapter_submission", required: true },

    status: { type: String, enum: ["open", "resolved", "reopened"], default: "open" },
    feedbackType: { type: String }, // e.g. "review_comment", "general"

    comment: { type: String, required: true },
    response: { type: String },
    responseAt: { type: Date },

    read: { type: Boolean, default: false },
  },
  { timestamps: true } // replaces the manual createdat/updatedAt fields
);

const feedback = mongoose.model("feedback", feedbackSchema);

module.exports = feedback;
