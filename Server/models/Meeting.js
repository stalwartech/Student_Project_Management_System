const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true }, // was ref: 'User' (doesn't exist)
    project: { type: mongoose.Schema.Types.ObjectId, ref: "project", required: true }, // was ref: 'Project' (doesn't exist)

    // Was a single required `attendedBy` ObjectId, which can't represent a
    // multi-student meeting or track per-person attendance/join time.
    attendees: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
        status: { type: String, enum: ["invited", "joined", "declined"], default: "invited" },
        joinedAt: { type: Date },
      },
    ],

    meetingURL: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },

    startedAt: { type: Date },
    endedAt: { type: Date },

    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const meeting = mongoose.model("meeting", meetingSchema);

module.exports = meeting;
