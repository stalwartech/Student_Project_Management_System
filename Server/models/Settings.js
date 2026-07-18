const mongoose = require("mongoose");

// Singleton settings document (only one row should ever exist - enforced in
// the controller, not the schema, since Mongoose has no native singleton type).
const settingsSchema = new mongoose.Schema(
  {
    defaultProjectLimit: { type: Number, default: 1 }, // max projects a single title-slot represents, if used
    defaultSupervisorLimit: { type: Number, default: 5 }, // max projects per supervisor
    defaultStudentLimit: { type: Number, default: 4 }, // max students per project
    autoAllocationEnabled: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
  },
  { timestamps: true }
);

const Settings = mongoose.model("settings", settingsSchema);

module.exports = Settings;
