const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Submitted", "Approved", "Completed"],
      default: "Not Started",
    },
    startDate: { type: Date },
    deadline: { type: Date }, // was "Dealine" (typo) - fixed
    completionDate: { type: Date },
    priority: { type: String, enum: ["Low", "Medium", "High"] },

    project: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true },
    chapterNumber: { type: String },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true } // replaces the manual createdAt/updatedAt fields
);

const chapter = mongoose.model("chapter", chapterSchema);

module.exports = chapter;
