const Meeting = require("../models/Meeting");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { notifyMany } = require("../utils/notify");
const logActivity = require("../utils/logActivity");

// POST /meetings  { project, title, description, meetingURL, startedAt }
const createMeeting = asyncHandler(async (req, res) => {
  const { project, title, description, meetingURL, startedAt } = req.body;
  if (!project || !title || !meetingURL) throw new ApiError(400, "project, title and meetingURL are required");

  const proj = await Project.findById(project).select("students supervisor title");
  if (!proj) throw new ApiError(404, "Project not found");

  const attendeeIds = [...proj.students, proj.supervisor].filter((id) => id && String(id) !== String(req.user._id));

  const meeting = await Meeting.create({
    createdBy: req.user._id,
    project,
    title,
    description,
    meetingURL,
    startedAt,
    attendees: attendeeIds.map((user) => ({ user, status: "invited" })),
  });

  await notifyMany({
    sender: req.user._id,
    recipients: attendeeIds,
    title: "Meeting scheduled",
    message: `A meeting "${title}" has been scheduled for "${proj.title}".`,
  });

  await logActivity({
    actor: req.user._id,
    action: "meeting_scheduled",
    entityType: "meeting",
    entityId: meeting._id,
    project,
  });

  return sendSuccess(res, 201, "Meeting scheduled", meeting);
});

// GET /meetings?project=
const getMeetings = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.project) query.project = req.query.project;
  else {
    // Default: meetings the current user created or is invited to.
    query.$or = [{ createdBy: req.user._id }, { "attendees.user": req.user._id }];
  }

  const meetings = await Meeting.find(query).sort({ startedAt: -1 });
  return sendSuccess(res, 200, "Meetings", meetings);
});

// GET /meetings/:meetingId
const getMeetingById = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.meetingId).populate("attendees.user", "name role");
  if (!meeting) throw new ApiError(404, "Meeting not found");
  return sendSuccess(res, 200, "Meeting", meeting);
});

// PATCH /meetings/:meetingId
const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findByIdAndUpdate(req.params.meetingId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!meeting) throw new ApiError(404, "Meeting not found");

  await notifyMany({
    sender: req.user._id,
    recipients: meeting.attendees.map((a) => a.user),
    title: "Meeting updated",
    message: `"${meeting.title}" has been updated.`,
  });

  return sendSuccess(res, 200, "Meeting updated", meeting);
});

// PATCH /meetings/:meetingId/cancel
const cancelMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findByIdAndUpdate(req.params.meetingId, { status: "cancelled" }, { new: true });
  if (!meeting) throw new ApiError(404, "Meeting not found");

  await notifyMany({
    sender: req.user._id,
    recipients: meeting.attendees.map((a) => a.user),
    title: "Meeting cancelled",
    message: `"${meeting.title}" has been cancelled.`,
  });

  return sendSuccess(res, 200, "Meeting cancelled", meeting);
});

// PATCH /meetings/:meetingId/complete
const completeMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.meetingId);
  if (!meeting) throw new ApiError(404, "Meeting not found");

  meeting.status = "completed";
  meeting.endedAt = new Date();
  if (meeting.startedAt) meeting.duration = Math.round((meeting.endedAt - meeting.startedAt) / 60000);
  await meeting.save();

  return sendSuccess(res, 200, "Meeting marked complete", meeting);
});

// POST /meetings/:meetingId/join
const joinMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.meetingId);
  if (!meeting) throw new ApiError(404, "Meeting not found");

  const attendee = meeting.attendees.find((a) => String(a.user) === String(req.user._id));
  if (attendee) {
    attendee.status = "joined";
    attendee.joinedAt = new Date();
  } else {
    meeting.attendees.push({ user: req.user._id, status: "joined", joinedAt: new Date() });
  }

  if (meeting.status === "scheduled") {
    meeting.status = "ongoing";
    meeting.startedAt = meeting.startedAt || new Date();
  }

  await meeting.save();
  return sendSuccess(res, 200, "Joined meeting", { meetingURL: meeting.meetingURL });
});

// POST /meetings/:meetingId/attendance  { userId, status }  - manually mark attendance
const markAttendance = asyncHandler(async (req, res) => {
  const { userId, status } = req.body;
  if (!userId || !status) throw new ApiError(400, "userId and status are required");

  const meeting = await Meeting.findById(req.params.meetingId);
  if (!meeting) throw new ApiError(404, "Meeting not found");

  const attendee = meeting.attendees.find((a) => String(a.user) === String(userId));
  if (attendee) {
    attendee.status = status;
    if (status === "joined") attendee.joinedAt = attendee.joinedAt || new Date();
  } else {
    meeting.attendees.push({ user: userId, status, joinedAt: status === "joined" ? new Date() : undefined });
  }
  await meeting.save();

  return sendSuccess(res, 200, "Attendance updated", meeting.attendees);
});

// GET /meetings/:meetingId/attendance  - was missing from the original routes; view attendance is spec'd for supervisors
const getAttendance = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.meetingId).populate("attendees.user", "name role");
  if (!meeting) throw new ApiError(404, "Meeting not found");
  return sendSuccess(res, 200, "Attendance", meeting.attendees);
});

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  completeMeeting,
  joinMeeting,
  markAttendance,
  getAttendance,
};
