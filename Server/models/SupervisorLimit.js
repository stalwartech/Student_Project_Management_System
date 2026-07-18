const mongoose = require("mongoose");

// Per-supervisor override of the global default supervisor workload limit
// (see Settings.js for the system-wide default).
const supervisorLimitSchema = new mongoose.Schema(
  {
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth", // was ref: 'Supervisor' - that model never existed
      required: true,
      unique: true,
    },
    limit: { type: Number, required: true },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
  },
  { timestamps: true }
);

const SupervisorLimit = mongoose.model("SupervisorLimit", supervisorLimitSchema);

module.exports = SupervisorLimit;
