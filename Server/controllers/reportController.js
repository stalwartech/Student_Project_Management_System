const User = require("../models/User");
const Project = require("../models/Project");
const AcademicSession = require("../models/AcademicSession");
const Meeting = require("../models/Meeting");
const Feedback = require("../models/Feedback");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { toCSV, streamExcel, streamPDF } = require("../utils/exportHelpers");

const REPORTS = {
  students: async () =>
    (await User.find({ role: "student" }).select("name matric email department level isActivated").lean()).map((s) => ({
      Name: s.name,
      Matric: s.matric,
      Email: s.email,
      Department: s.department,
      Level: s.level,
      Activated: s.isActivated ? "Yes" : "No",
    })),

  supervisors: async () =>
    (await User.find({ role: "supervisor" }).select("name staffId email department title").lean()).map((s) => ({
      Name: s.name,
      "Staff ID": s.staffId,
      Email: s.email,
      Department: s.department,
      Title: s.title,
    })),

  projects: async () =>
    (await Project.find().populate("supervisor", "name").populate("students", "name").lean()).map((p) => ({
      Title: p.title,
      Code: p.projectCode,
      Type: p.projectType,
      Status: p.status,
      Completion: `${p.completionPercentage}%`,
      Supervisor: p.supervisor?.name || "",
      Students: (p.students || []).map((s) => s.name).join("; "),
      Deadline: p.deadline ? new Date(p.deadline).toDateString() : "",
    })),

  "academic-sessions": async () =>
    (await AcademicSession.find().lean()).map((s) => ({
      Session: s.session,
      Active: s.isActive ? "Yes" : "No",
      StartDate: new Date(s.startDate).toDateString(),
      EndDate: new Date(s.endDate).toDateString(),
    })),

  "project-completion": async () =>
    (await Project.find().select("title projectCode status completionPercentage deadline").lean()).map((p) => ({
      Title: p.title,
      Code: p.projectCode,
      Status: p.status,
      Completion: `${p.completionPercentage}%`,
      Deadline: p.deadline ? new Date(p.deadline).toDateString() : "",
    })),

  meetings: async () =>
    (await Meeting.find().populate("createdBy", "name").populate("project", "title").lean()).map((m) => ({
      Title: m.title,
      Project: m.project?.title || "",
      CreatedBy: m.createdBy?.name || "",
      Status: m.status,
      StartedAt: m.startedAt ? new Date(m.startedAt).toLocaleString() : "",
      DurationMinutes: m.duration,
    })),

  feedback: async () =>
    (await Feedback.find().populate("createdBy", "name").populate("project", "title").lean()).map((f) => ({
      Project: f.project?.title || "",
      CreatedBy: f.createdBy?.name || "",
      Priority: f.priority,
      Status: f.status,
      Comment: f.comment,
      CreatedAt: new Date(f.createdAt).toLocaleString(),
    })),
};

// GET /reports/:type?format=csv|excel|pdf
const generateReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const format = (req.query.format || "csv").toLowerCase();

  const builder = REPORTS[type];
  if (!builder) {
    throw new ApiError(400, `Unknown report type "${type}". Valid types: ${Object.keys(REPORTS).join(", ")}`);
  }

  const rows = await builder();
  const filename = `${type}-report-${new Date().toISOString().slice(0, 10)}`;
  const title = type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Report";

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
    return res.send(toCSV(rows));
  }

  if (format === "excel") {
    return streamExcel(res, { title, rows, filename });
  }

  if (format === "pdf") {
    return streamPDF(res, { title, rows, filename });
  }

  throw new ApiError(400, "format must be one of: csv, excel, pdf");
});

module.exports = { generateReport };
