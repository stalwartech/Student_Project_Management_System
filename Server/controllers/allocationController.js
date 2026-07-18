const User = require("../models/User");
const Project = require("../models/Project");
const AcademicSession = require("../models/AcademicSession");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { runAutoAllocation } = require("../utils/allocationEngine");
const logActivity = require("../utils/logActivity");
const { notify } = require("../utils/notify");

const getUnassignedStudents = async (sessionId) => {
  const assignedIds = (await Project.find({ academicSession: sessionId }).distinct("students"));
  return User.find({ role: "student", isDeactivated: false, _id: { $nin: assignedIds } });
};

// POST /coordinator/projects/auto-allocation
const autoAllocation = asyncHandler(async (req, res) => {
  const session = await AcademicSession.findOne({ isActive: true });
  if (!session) throw new ApiError(400, "No active academic session");

  const students = await getUnassignedStudents(session._id);
  const { proposals, skipped } = await runAutoAllocation({ students, session, dryRun: false });

  await Promise.all(
    proposals.map((p) => notify({ recipient: p.student, title: "Project assigned", message: "You have been auto-assigned to a project." }))
  );

  await logActivity({
    actor: req.user._id,
    action: "auto_allocation_run",
    description: `Auto-allocated ${proposals.length} student(s), skipped ${skipped.length}`,
  });

  return sendSuccess(res, 200, "Auto allocation complete", { assigned: proposals.length, proposals, skipped });
});

// POST /coordinator/projects/preview-allocation
const previewAllocation = asyncHandler(async (req, res) => {
  const session = await AcademicSession.findOne({ isActive: true });
  if (!session) throw new ApiError(400, "No active academic session");

  const students = await getUnassignedStudents(session._id);
  const { proposals, skipped } = await runAutoAllocation({ students, session, dryRun: true });

  return sendSuccess(res, 200, "Allocation preview (not saved)", { proposals, skipped });
});

module.exports = { autoAllocation, previewAllocation };
