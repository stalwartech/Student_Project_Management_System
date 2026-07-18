const AcademicSession = require("../models/AcademicSession");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const logActivity = require("../utils/logActivity");

// POST /coordinator/academic-session
const createSession = asyncHandler(async (req, res) => {
  const { session, startDate, endDate } = req.body;
  if (!session || !startDate || !endDate) {
    throw new ApiError(400, "session, startDate and endDate are required");
  }

  const created = await AcademicSession.create({
    session,
    startDate,
    endDate,
    createdBy: req.user._id,
  });

  return sendSuccess(res, 201, "Academic session created", created);
});

// GET /coordinator/academic-session
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await AcademicSession.find().sort({ startDate: -1 });
  return sendSuccess(res, 200, "Academic sessions", sessions);
});

// PATCH /coordinator/academic-session/:sessionId
const updateSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const updated = await AcademicSession.findByIdAndUpdate(sessionId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, "Academic session not found");
  return sendSuccess(res, 200, "Academic session updated", updated);
});

// PATCH /coordinator/academic-session/:sessionId/activate
// Only one session can be active at a time, so this deactivates all others first.
const activateSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await AcademicSession.findById(sessionId);
  if (!session) throw new ApiError(404, "Academic session not found");

  await AcademicSession.updateMany({ _id: { $ne: sessionId } }, { isActive: false });
  session.isActive = true;
  await session.save();

  await logActivity({
    actor: req.user._id,
    action: "academic_session_activated",
    entityType: "academicSession",
    entityId: session._id,
    description: `Activated session ${session.session}`,
  });

  return sendSuccess(res, 200, "Academic session activated", session);
});

// PATCH /coordinator/academic-session/:sessionId/deactivate
const deactivateSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await AcademicSession.findByIdAndUpdate(sessionId, { isActive: false }, { new: true });
  if (!session) throw new ApiError(404, "Academic session not found");
  return sendSuccess(res, 200, "Academic session deactivated", session);
});

module.exports = { createSession, getSessions, updateSession, activateSession, deactivateSession };
