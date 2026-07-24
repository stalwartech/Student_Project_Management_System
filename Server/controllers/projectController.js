const Project = require("../models/Project");
const Chapter = require("../models/Chapter");
const AcademicSession = require("../models/AcademicSession");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const generateProjectCode = require("../utils/generateProjectCode");
const logActivity = require("../utils/logActivity");

// POST /coordinator/projects
const createProject = asyncHandler(async (req, res) => {
  const { title, description, projectType, academicSession, deadline, startDate, department } = req.body;
  if (!title || !description || !projectType || !academicSession || !deadline || !startDate) {
    throw new ApiError(400, "title, description, projectType, academicSession, deadline and startDate are required");
  }

  const session = await AcademicSession.findById(academicSession);
  if (!session) throw new ApiError(404, "Academic session not found");

  const duplicate = await Project.findOne({ title, academicSession });
  if (duplicate) throw new ApiError(409, "A project with this title already exists in this academic session");

  const projectCode = await generateProjectCode();

  const project = await Project.create({
    title,
    description,
    projectType,
    academicSession,
    deadline,
    startDate,
    department,
    projectCode,
    createdBy: req.user._id,
    // supervisor is required by the schema but assigned via the dedicated
    // assignment endpoint in the real flow - if not supplied yet, the
    // coordinator is expected to call assign-supervisor right after.
    supervisor: req.body.supervisor,
  });

  await logActivity({
    actor: req.user._id,
    action: "project_created",
    entityType: "project",
    entityId: project._id,
    project: project._id,
    description: `Created project "${project.title}"`,
  });

  return sendSuccess(res, 201, "Project created", project);
});

// POST /supervisor/projects
// Supervisors create projects for the currently active academic session and
// automatically become the supervisor for those projects.
const createSupervisorProject = asyncHandler(async (req, res) => {
  const { title, description, deadline, startDate, department, studentIds, projectLeader } = req.body;
  if (!title || !description || !deadline || !startDate || !Array.isArray(studentIds) || studentIds.length === 0) {
    throw new ApiError(400, "title, description, deadline, startDate, and at least one student are required");
  }
  if (new Set(studentIds.map(String)).size !== studentIds.length) throw new ApiError(400, "Each student can only be selected once");

  const session = await AcademicSession.findOne({ isActive: true });
  if (!session) throw new ApiError(400, "No active academic session");

  const duplicate = await Project.findOne({ title, academicSession: session._id });
  if (duplicate) throw new ApiError(409, "A project with this title already exists in this academic session");

  const [students, alreadyAssigned] = await Promise.all([
    User.find({
      _id: { $in: studentIds },
      role: "student",
      assignedSupervisor: req.user._id,
      supervisorAssignmentSession: session._id,
    }).select("_id"),
    Project.find({ academicSession: session._id, students: { $in: studentIds } }).distinct("students"),
  ]);
  if (students.length !== studentIds.length) {
    throw new ApiError(400, "Select only students assigned to you in the active session");
  }
  if (alreadyAssigned.length) throw new ApiError(409, "One or more selected students already belong to a project in this session");

  const projectType = studentIds.length === 1 ? "Individual" : "Group";
  if (projectType === "Group" && (!projectLeader || !studentIds.some((id) => String(id) === String(projectLeader)))) {
    throw new ApiError(400, "Choose a project leader from the selected students");
  }

  const project = await Project.create({
    title,
    description,
    projectType,
    academicSession: session._id,
    deadline,
    startDate,
    department,
    projectCode: await generateProjectCode(),
    supervisor: req.user._id,
    students: studentIds,
    projectLeader: projectType === "Group" ? projectLeader : studentIds[0],
    createdBy: req.user._id,
  });

  await logActivity({
    actor: req.user._id,
    action: "project_created",
    entityType: "project",
    entityId: project._id,
    project: project._id,
    description: `Created project "${project.title}"`,
  });

  return sendSuccess(res, 201, "Project created", project);
});

// GET /supervisor/available-students
// Supervisors may only add students already allocated to them by the
// coordinator, and only while those students have no project this session.
const getSupervisorAvailableStudents = asyncHandler(async (req, res) => {
  const session = await AcademicSession.findOne({ isActive: true });
  if (!session) throw new ApiError(400, "No active academic session");

  const projectStudentIds = await Project.find({ academicSession: session._id }).distinct("students");
  const students = await User.find({
    role: "student",
    assignedSupervisor: req.user._id,
    supervisorAssignmentSession: session._id,
    _id: { $nin: projectStudentIds },
  })
    .select("name matric email department level")
    .sort({ name: 1 });

  return sendSuccess(res, 200, "Available students", { session: session.session, students });
});

// PATCH /supervisor/projects/:projectID/type
const updateSupervisorProjectType = asyncHandler(async (req, res) => {
  const { projectType } = req.body;
  if (!["Individual", "Group"].includes(projectType)) {
    throw new ApiError(400, "projectType must be Individual or Group");
  }

  const project = await Project.findOne({ _id: req.params.projectID, supervisor: req.user._id });
  if (!project) throw new ApiError(404, "Project not found or not assigned to you");

  project.projectType = projectType;
  project.updatedBy = req.user._id;
  await project.save();

  await logActivity({
    actor: req.user._id,
    action: "project_type_updated",
    entityType: "project",
    entityId: project._id,
    project: project._id,
    description: `Changed project type to ${projectType}`,
  });

  return sendSuccess(res, 200, "Project type updated", project);
});

// GET /coordinator/projects  (also backs /projects, /projects/search, /project/filter)
const getProjects = asyncHandler(async (req, res) => {
  const { search, status, department, academicSession, supervisor, projectType, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) query.title = { $regex: search, $options: "i" };
  if (status) query.status = status;
  if (department) query.department = department;
  if (academicSession) query.academicSession = academicSession;
  if (supervisor) query.supervisor = supervisor;
  if (projectType) query.projectType = projectType;

  const skip = (Number(page) - 1) * Number(limit);
  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate("supervisor", "name email title")
      .populate("students", "name matric")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Project.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Projects", { projects, total, page: Number(page), limit: Number(limit) });
});

// PATCH /coordinator/projects/:projectID
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectID);
  if (!project) throw new ApiError(404, "Project not found");

  Object.assign(project, req.body, { updatedBy: req.user._id });
  await project.save();

  return sendSuccess(res, 200, "Project updated", project);
});

// DELETE /coordinator/projects/:projectID
// Per spec: coordinator may delete projects "before students begin work" -
// enforced here as "no chapters have been created yet for this project".
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectID);
  if (!project) throw new ApiError(404, "Project not found");

  const chapterCount = await Chapter.countDocuments({ project: project._id });
  if (chapterCount > 0) {
    throw new ApiError(409, "Cannot delete a project once work has started (chapters already exist). Archive it instead.");
  }

  await project.deleteOne();
  await logActivity({ actor: req.user._id, action: "project_deleted", entityType: "project", entityId: project._id });

  return sendSuccess(res, 200, "Project deleted");
});

// GET /projects/my-project  (student)
const getMyProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ students: req.user._id })
    .populate("supervisor", "name email title")
    .populate("students", "name matric");
  if (!project) throw new ApiError(404, "You have not been assigned a project yet");
  return sendSuccess(res, 200, "Your project", project);
});

// GET /projects/assigned  (supervisor)
const getAssignedProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ supervisor: req.user._id }).populate("students", "name matric");
  return sendSuccess(res, 200, "Assigned projects", projects);
});

// GET /supervisor/assigned-students
// Includes direct supervisor allocations and students attached through the
// supervisor's projects, grouped so a student can show every relevant session.
const getSupervisorAssignedStudents = asyncHandler(async (req, res) => {
  const [directStudents, projects] = await Promise.all([
    User.find({ role: "student", assignedSupervisor: req.user._id })
      .select("name email matric department level gender phone whatsapp supervisorAssignmentSession")
      .populate("supervisorAssignmentSession", "session isActive"),
    Project.find({ supervisor: req.user._id })
      .select("title students academicSession")
      .populate("students", "name email matric department level gender phone whatsapp")
      .populate("academicSession", "session isActive"),
  ]);

  const records = new Map();
  const addSession = (record, session, projectTitle) => {
    if (!session) return;
    const key = String(session._id);
    if (!record.sessions.some((item) => item._id === key)) {
      record.sessions.push({ _id: key, session: session.session, isActive: session.isActive, projectTitle });
    }
  };

  directStudents.forEach((student) => {
    const record = { ...student.toObject(), sessions: [] };
    addSession(record, student.supervisorAssignmentSession, null);
    records.set(String(student._id), record);
  });
  projects.forEach((project) => {
    project.students.forEach((student) => {
      const key = String(student._id);
      const record = records.get(key) ?? { ...student.toObject(), sessions: [] };
      addSession(record, project.academicSession, project.title);
      records.set(key, record);
    });
  });

  return sendSuccess(res, 200, "Assigned students", Array.from(records.values()).sort((a, b) => a.name.localeCompare(b.name)));
});

// GET /student/my-supervisor
const getMySupervisorAssignment = asyncHandler(async (req, res) => {
  const student = await User.findById(req.user._id)
    .select("assignedSupervisor supervisorAssignmentSession")
    .populate("assignedSupervisor", "name email title department phone whatsapp staffId")
    .populate("supervisorAssignmentSession", "session isActive");

  let supervisor = student.assignedSupervisor;
  let session = student.supervisorAssignmentSession;
  let projectTitle = null;
  if (!supervisor) {
    const project = await Project.findOne({ students: req.user._id })
      .sort({ createdAt: -1 })
      .populate("supervisor", "name email title department phone whatsapp staffId")
      .populate("academicSession", "session isActive");
    supervisor = project?.supervisor ?? null;
    session = project?.academicSession ?? null;
    projectTitle = project?.title ?? null;
  }

  return sendSuccess(res, 200, "Supervisor assignment", { supervisor, session, projectTitle });
});

// GET /projects/:projectId
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId)
    .populate("supervisor", "name email title")
    .populate("students", "name matric email")
    .populate("academicSession", "session isActive");
  if (!project) throw new ApiError(404, "Project not found");
  return sendSuccess(res, 200, "Project", project);
});

// GET /projects/:projectId/members
const getProjectMembers = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId)
    .populate("students", "name matric email")
    .populate("supervisor", "name email title")
    .populate("projectLeader", "name matric");
  if (!project) throw new ApiError(404, "Project not found");
  return sendSuccess(res, 200, "Project members", {
    supervisor: project.supervisor,
    students: project.students,
    projectLeader: project.projectLeader,
  });
});

// GET /projects/:projectId/supervisors  (currently assigned supervisor + history could extend this)
const getProjectSupervisor = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId).populate("supervisor", "name email title department");
  if (!project) throw new ApiError(404, "Project not found");
  return sendSuccess(res, 200, "Project supervisor", project.supervisor);
});

// GET /projects/:projectId/timeline
const getProjectTimeline = asyncHandler(async (req, res) => {
  const chapters = await Chapter.find({ project: req.params.projectId }).sort({ chapterNumber: 1 });
  return sendSuccess(res, 200, "Project timeline", chapters);
});

// GET /projects/:projectId/analytics
const getProjectAnalytics = asyncHandler(async (req, res) => {
  const chapters = await Chapter.find({ project: req.params.projectId });
  const completed = chapters.filter((c) => c.status === "Completed").length;
  return sendSuccess(res, 200, "Project analytics", {
    totalChapters: chapters.length,
    completedChapters: completed,
    chapterCompletionRate: chapters.length ? Math.round((completed / chapters.length) * 100) : 0,
  });
});

// PATCH /projects/:projectId/lock  (supervisor)
const lockProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.projectId, { isLocked: true }, { new: true });
  if (!project) throw new ApiError(404, "Project not found");
  return sendSuccess(res, 200, "Project locked", project);
});

// PATCH /projects/:projectId/unlock  (supervisor)
const unlockProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.projectId, { isLocked: false }, { new: true });
  if (!project) throw new ApiError(404, "Project not found");
  return sendSuccess(res, 200, "Project unlocked", project);
});

module.exports = {
  createProject,
  createSupervisorProject,
  getSupervisorAvailableStudents,
  updateSupervisorProjectType,
  getProjects,
  updateProject,
  deleteProject,
  getMyProject,
  getAssignedProjects,
  getSupervisorAssignedStudents,
  getMySupervisorAssignment,
  getProjectById,
  getProjectMembers,
  getProjectSupervisor,
  getProjectTimeline,
  getProjectAnalytics,
  lockProject,
  unlockProject,
};
