const ActivityLog = require("../models/ActivityLog");

/**
 * logActivity({ actor, action, entityType, entityId, project, description })
 * Fire-and-forget: failures are logged but never block the calling request,
 * since activity logging should never be the reason a real operation fails.
 */
const logActivity = async ({ actor, action, entityType, entityId, project, description }) => {
  try {
    await ActivityLog.create({ actor, action, entityType, entityId, project, description });
  } catch (err) {
    console.error("Failed to log activity:", err.message);
  }
};

module.exports = logActivity;
