const mongoose = require("mongoose");

const authSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["coordinator", "supervisor", "student"],
      required: true,
    },

    gender: { type: String },
    phone: { type: String }, // optional per spec (both students and supervisors)
    whatsapp: { type: String }, // optional per spec
    photo: { type: String },
    department: { type: String, required: true }, // required for both students and supervisors

    // Student-only fields (not schema-required, since supervisors/coordinators don't have them)
    matric: { type: String, unique: true, sparse: true },
    level: { type: String },
    cgpa: { type: String },

    // A coordinator can allocate a student to a supervisor before the
    // supervisor has created a project. The session keeps that allocation
    // scoped to the active academic period.
    assignedSupervisor: { type: mongoose.Schema.Types.ObjectId, ref: "auth", default: null },
    supervisorAssignmentSession: { type: mongoose.Schema.Types.ObjectId, ref: "academicSession", default: null },

    // Supervisor-only fields
    staffId: { type: String, unique: true, sparse: true },
    title: { type: String },

    isActivated: { type: Boolean, default: false },
    isDeactivated: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: true },

    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Role-conditional validation that a plain `required: true` can't express,
// since Coordinator/Supervisor/Student all share this one collection.
authSchema.pre("validate", function (next) {
  if (this.role === "student" && !this.matric) {
    this.invalidate("matric", "matric is required for students");
  }
  if (this.role === "supervisor" && !this.staffId) {
    this.invalidate("staffId", "staffId is required for supervisors");
  }
  next();
});

const authModel = mongoose.model("auth", authSchema);

module.exports = authModel;
