const User = require("../models/User");
const Project = require("../models/Project");
const Chapter = require("../models/Chapter");
const ChapterSubmission = require("../models/ChapterSubmission");
const AcademicSession = require("../models/AcademicSession");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiError");

// GET /analytics/student
const studentAnalytics = asyncHandler(async (req, res) => {
  const [total, activated, withProjects] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "student", isActivated: true }),
    Project.distinct("students").then((ids) => ids.length),
  ]);
  return sendSuccess(res, 200, "Student analytics", {
    total,
    activated,
    pendingActivation: total - activated,
    withProjects,
    withoutProjects: total - withProjects,
  });
});

// GET /analytics/supervisor
const supervisorAnalytics = asyncHandler(async (req, res) => {
  const workload = await Project.aggregate([
    { $group: { _id: "$supervisor", projectCount: { $sum: 1 } } },
    { $lookup: { from: "auths", localField: "_id", foreignField: "_id", as: "supervisor" } },
    { $unwind: "$supervisor" },
    { $project: { "supervisor.name": 1, "supervisor.email": 1, projectCount: 1 } },
  ]);
  const total = await User.countDocuments({ role: "supervisor" });
  return sendSuccess(res, 200, "Supervisor analytics", { total, workload });
});

// GET /analytics/projects
const projectAnalytics = asyncHandler(async (req, res) => {
  const byStatus = await Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const avgCompletion = await Project.aggregate([
    { $group: { _id: null, avg: { $avg: "$completionPercentage" } } },
  ]);
  return sendSuccess(res, 200, "Project analytics", {
    byStatus,
    averageCompletion: avgCompletion[0]?.avg || 0,
  });
});

// GET /analytics/department
const departmentAnalytics = asyncHandler(async (req, res) => {
  const byDepartment = await Project.aggregate([
    { $group: { _id: "$department", count: { $sum: 1 }, avgCompletion: { $avg: "$completionPercentage" } } },
  ]);
  return sendSuccess(res, 200, "Department analytics", byDepartment);
});

// GET /analytics/academic-session
const academicSessionAnalytics = asyncHandler(async (req, res) => {
  const sessions = await AcademicSession.find().lean();
  const results = await Promise.all(
    sessions.map(async (s) => ({
      session: s.session,
      isActive: s.isActive,
      projectCount: await Project.countDocuments({ academicSession: s._id }),
    }))
  );
  return sendSuccess(res, 200, "Academic session analytics", results);
});

// GET /analytics/dashboard  (also reused by GET /coordinator/analytics)
const dashboardAnalytics = asyncHandler(async (req, res) => {
  const completionByMonth = await Project.aggregate([
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const submissionTrends = await ChapterSubmission.aggregate([
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$submittedAt" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return sendSuccess(res, 200, "Dashboard charts", {
    projectCompletionRate: completionByMonth,
    chapterSubmissionTrends: submissionTrends,
  });
});

module.exports = {
  studentAnalytics,
  supervisorAnalytics,
  projectAnalytics,
  departmentAnalytics,
  academicSessionAnalytics,
  dashboardAnalytics,
};
