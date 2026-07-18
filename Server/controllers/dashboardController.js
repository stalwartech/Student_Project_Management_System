const User = require("../models/User");
const Project = require("../models/Project");
const AcademicSession = require("../models/AcademicSession");
const Feedback = require("../models/Feedback");
const Meeting = require("../models/Meeting");
const ChapterSubmission = require("../models/ChapterSubmission");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiError");

// GET /coordinator/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const activeSession = await AcademicSession.findOne({ isActive: true });

  const [
    totalStudents,
    totalSupervisors,
    totalProjects,
    activeProjects,
    completedProjects,
    studentsAssigned,
    studentsPendingActivation,
    pendingChapterReviews,
    upcomingMeetings,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "supervisor" }),
    Project.countDocuments({}),
    Project.countDocuments({ status: "In Progress" }),
    Project.countDocuments({ status: "Completed" }),
    Project.distinct("students").then((ids) => ids.length),
    User.countDocuments({ role: "student", isActivated: false }),
    ChapterSubmission.countDocuments({ status: "pending" }),
    Meeting.countDocuments({ status: "scheduled", startedAt: { $gte: new Date() } }),
  ]);

  return sendSuccess(res, 200, "Coordinator dashboard", {
    totalStudents,
    totalSupervisors,
    totalProjects,
    activeProjects,
    completedProjects,
    studentsWithoutProjects: totalStudents - studentsAssigned,
    studentsPendingActivation,
    pendingChapterReviews,
    upcomingMeetings,
    activeAcademicSession: activeSession?.session || null,
  });
});

// GET /coordinator/analytics  - delegates to the same chart data as /analytics/dashboard
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { dashboardAnalytics } = require("./analyticController");
  return dashboardAnalytics(req, res);
});

module.exports = { getDashboard, getDashboardAnalytics };
