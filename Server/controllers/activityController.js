const ActivityLog = require("../models/ActivityLog");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiError");

const paginate = (req) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  return { page, limit, skip: (page - 1) * limit };
};

// GET /activities/project/:projectId
const getProjectActivities = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const activities = await ActivityLog.find({ project: req.params.projectId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("actor", "name role");
  return sendSuccess(res, 200, "Project activities", { activities, page, limit });
});

// GET /activities/student/:studentId
const getStudentActivities = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const activities = await ActivityLog.find({ actor: req.params.studentId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return sendSuccess(res, 200, "Student activities", { activities, page, limit });
});

// GET /activities/supervisor/:supervisorId
const getSupervisorActivities = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const activities = await ActivityLog.find({ actor: req.params.supervisorId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  return sendSuccess(res, 200, "Supervisor activities", { activities, page, limit });
});

// GET /activities/system  (coordinator-only, system-wide feed)
const getSystemActivities = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const activities = await ActivityLog.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("actor", "name role");
  return sendSuccess(res, 200, "System activities", { activities, page, limit });
});

module.exports = { getProjectActivities, getStudentActivities, getSupervisorActivities, getSystemActivities };
