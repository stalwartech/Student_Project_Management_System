const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    startDate: { type: Date, required: true },

    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true },

    // Was a single ObjectId - fixed to an array so Group projects can hold
    // multiple students, matching bulk/auto assignment in the spec.
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "auth" }],
    projectLeader: { type: mongoose.Schema.Types.ObjectId, ref: "auth" }, // for Group projects

    projectType: { type: String, enum: ["Individual", "Group"], required: true },
    projectCode: { type: String, unique: true, sparse: true },

    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed", "Archived"],
      default: "Not Started",
    },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },

    department: { type: String },

    // Was a free-text String - fixed to a ref so the duplicate-title-per-session
    // check and session-scoped queries actually work.
    academicSession: { type: mongoose.Schema.Types.ObjectId, ref: "academicSession", required: true },

    // Was `{ type: String, enum: [true, false] }` - fixed to a real Boolean.
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true } // was missing - createdOn/updatedOn are now handled by this
);

// Enforce "no duplicate project titles within the same academic session"
projectSchema.index({ title: 1, academicSession: 1 }, { unique: true });

const projectModel = mongoose.model("project", projectSchema);

module.exports = projectModel;
