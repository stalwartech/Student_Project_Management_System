const mongoose = require("mongoose");

// Backs the "Activity Monitoring" section of the spec (activityRoute.js) and
// the Coordinator dashboard's recent-activity feed. Not present in the
// original model upload even though the routes referenced it.
const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true },
    action: { type: String, required: true }, // e.g. "student_activated", "chapter_submitted"
    entityType: { type: String }, // e.g. "project", "chapter_submission", "meeting"
    entityId: { type: mongoose.Schema.Types.ObjectId },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "project" },
    description: { type: String },
  },
  { timestamps: true }
);

activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ actor: 1, createdAt: -1 });

const ActivityLog = mongoose.model("activityLog", activityLogSchema);

module.exports = ActivityLog;
