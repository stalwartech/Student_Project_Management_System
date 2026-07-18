const mongoose = require("mongoose");

// Embedded (not its own collection) since checklist items only ever make
// sense in the context of a single task and are always fetched with it.
const checklistItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "Overdue"],
      default: "Not Started",
    },
    startDate: { type: Date },
    deadline: { type: Date },
    completionDate: { type: Date },

    chapter: { type: mongoose.Schema.Types.ObjectId, ref: "chapter", required: true },
    taskNumber: { type: String },

    checklist: [checklistItemSchema], // was entirely missing, needed by taskRoute's checklist endpoints

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
  },
  { timestamps: true }
);

const task = mongoose.model("task", taskSchema);

module.exports = task;
