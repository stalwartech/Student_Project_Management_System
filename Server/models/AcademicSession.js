const mongoose = require("mongoose");

const academicSessionSchema = new mongoose.Schema(
  {
    session: { type: String, required: true, unique: true }, // e.g. "2025/2026"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true },
  },
  { timestamps: true }
);

const academicSessionModel = mongoose.model("academicSession", academicSessionSchema);

module.exports = academicSessionModel;
