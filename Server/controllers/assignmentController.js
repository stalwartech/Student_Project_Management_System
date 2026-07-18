const Project = require("../models/Project");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { getSupervisorWorkload } = require("../utils/allocationEngine");
const { notify } = require("../utils/notify");
const logActivity = require("../utils/logActivity");

// POST /coordinator/projects/:projectID/assign-supervisor  { supervisorId }
// SOFT limit check: warns on overload but still allows the coordinator to proceed.
const assignSupervisor = asyncHandler(async (req, res) => {
  const { projectID } = req.params;
  const { supervisorId } = req.body;
  if (!supervisorId) throw new ApiError(400, "supervisorId is required");

  const project = await Project.findById(projectID);
  if (!project) throw new ApiError(404, "Project not found");

  const supervisor = await User.findOne({ _id: supervisorId, role: "supervisor" });
  if (!supervisor) throw new ApiError(404, "Supervisor not found");

  const workload = await getSupervisorWorkload(supervisorId, project.academicSession);

  project.supervisor = supervisorId;
  project.updatedBy = req.user._id;
  await project.save();

  await notify({ recipient: supervisorId, title: "New project assigned", message: `You've been assigned to "${project.title}".` });
  await logActivity({
    actor: req.user._id,
    action: "supervisor_assigned",
    entityType: "project",
    entityId: project._id,
    project: project._id,
  });

  return sendSuccess(res, 200, "Supervisor assigned", {
    project,
    workloadWarning: workload.exceeded
      ? `This supervisor now has ${workload.currentLoad + 1} projects, exceeding their limit of ${workload.limit}`
      : null,
  });
});

// PATCH /coordinator/projects/:projectID/change-supervisor  { supervisorId }
const changeSupervisor = asyncHandler(async (req, res) => {
  // Same soft-check semantics as assign - reuse the same handler logic.
  return assignSupervisor(req, res);
});

// POST /coordinator/projects/:projectID/assign-student  { studentId(s), force }
// Supports a single studentId or an array of studentIds (bulk assignment).
// If a student is already on another project, responds with a conflict the
// coordinator must resolve via `force: "keep" | "reassign" | "skip"`.
const assignStudent = asyncHandler(async (req, res) => {
  const { projectID } = req.params;
  const { studentIds, force } = req.body;
  if (!studentIds || !(Array.isArray(studentIds) ? studentIds.length : true)) {
    throw new ApiError(400, "studentIds is required (single id or array)");
  }
  const ids = Array.isArray(studentIds) ? studentIds : [studentIds];

  const project = await Project.findById(projectID);
  if (!project) throw new ApiError(404, "Project not found");

  const results = { assigned: [], conflicts: [], skipped: [] };

  for (const studentId of ids) {
    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      results.skipped.push({ studentId, reason: "Student not found" });
      continue;
    }

    const existingProject = await Project.findOne({
      _id: { $ne: project._id },
      academicSession: project.academicSession,
      students: studentId,
    });

    if (existingProject && !force) {
      results.conflicts.push({
        studentId,
        existingProjectId: existingProject._id,
        existingProjectTitle: existingProject.title,
        message: "Student is already assigned to another project this session. Resend with force: 'keep' | 'reassign' | 'skip'.",
      });
      continue;
    }

    if (existingProject && force === "skip") {
      results.skipped.push({ studentId, reason: "Skipped by coordinator" });
      continue;
    }

    if (existingProject && force === "keep") {
      results.skipped.push({ studentId, reason: "Kept on existing project" });
      continue;
    }

    if (existingProject && force === "reassign") {
      existingProject.students = existingProject.students.filter((id) => String(id) !== String(studentId));
      await existingProject.save();
    }

    if (!project.students.some((id) => String(id) === String(studentId))) {
      project.students.push(studentId);
    }
    results.assigned.push(studentId);

    await notify({ recipient: studentId, title: "Project assigned", message: `You've been assigned to "${project.title}".` });
  }

  await project.save();

  await logActivity({
    actor: req.user._id,
    action: "students_assigned",
    entityType: "project",
    entityId: project._id,
    project: project._id,
    description: `Assigned ${results.assigned.length} student(s)`,
  });

  return sendSuccess(res, 200, "Student assignment processed", results);
});

// DELETE /coordinator/projects/:projectID/remove-student/:studentID
const removeStudent = asyncHandler(async (req, res) => {
  const { projectID, studentID } = req.params;
  const project = await Project.findById(projectID);
  if (!project) throw new ApiError(404, "Project not found");

  project.students = project.students.filter((id) => String(id) !== String(studentID));
  await project.save();

  await logActivity({
    actor: req.user._id,
    action: "student_removed",
    entityType: "project",
    entityId: project._id,
    project: project._id,
  });

  return sendSuccess(res, 200, "Student removed from project", project);
});

module.exports = { assignSupervisor, changeSupervisor, assignStudent, removeStudent };
