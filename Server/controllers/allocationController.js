const User = require("../models/User");
const Project = require("../models/Project");
const AcademicSession = require("../models/AcademicSession");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { runAutoAllocation } = require("../utils/allocationEngine");
const logActivity = require("../utils/logActivity");
const { notify } = require("../utils/notify");

const getUnassignedStudents = async (sessionId, includeSupervisorAssigned = false) => {
  const assignedIds = (await Project.find({ academicSession: sessionId }).distinct("students"));
  // Allocation is a coordinator action, so account activation/deactivation
  // must not prevent a student from being assigned or reassigned later.
  const query = { role: "student", _id: { $nin: assignedIds } };
  if (!includeSupervisorAssigned) {
    query.$or = [
      { assignedSupervisor: null },
      { supervisorAssignmentSession: { $ne: sessionId } },
    ];
  }
  return User.find(query);
};

const getAllocationReadinessData = async () => {
  const session = await AcademicSession.findOne({ isActive: true });
  if (!session) {
    return {
      canRun: false,
      activeSession: null,
      unassignedStudents: 0,
      supervisedProjects: 0,
      supervisors: 0,
      message: "Activate an academic session before running auto-allocation.",
    };
  }

  const [supervisedProjects, supervisors] = await Promise.all([
    Project.countDocuments({ academicSession: session._id, supervisor: { $ne: null }, status: { $ne: "Archived" } }),
    User.countDocuments({ role: "supervisor", isDeactivated: false }),
  ]);
  const unassignedStudents = (await getUnassignedStudents(session._id, supervisedProjects > 0)).length;

  return {
    canRun: supervisors > 0 && unassignedStudents > 0,
    activeSession: session.session,
    unassignedStudents,
    supervisedProjects,
    supervisors,
    message:
      supervisors === 0
        ? "No active supervisors are available for allocation."
        : supervisedProjects === 0
          ? "Students will be allocated directly to supervisors. They can be placed into projects after those supervisors create them."
        : unassignedStudents === 0
          ? "All students in the active session are already allocated."
          : null,
  };
};

// GET /coordinator/projects/manual-allocation-options
// Returns people who can be selected in the manual allocation form. Students
// already placed in a project for the active session are excluded because a
// project assignment is the source of truth for that relationship.
const getManualAllocationOptions = asyncHandler(async (req, res) => {
  const session = await AcademicSession.findOne({ isActive: true });
  if (!session) throw new ApiError(400, "No active academic session");

  const projectStudentIds = await Project.find({ academicSession: session._id }).distinct("students");
  const [students, supervisors] = await Promise.all([
    User.find({ role: "student", _id: { $nin: projectStudentIds } })
      .select("name matric email department assignedSupervisor supervisorAssignmentSession")
      .populate("assignedSupervisor", "name title")
      .sort({ name: 1 }),
    User.find({ role: "supervisor", isDeactivated: false })
      .select("name title staffId email department")
      .sort({ name: 1 }),
  ]);

  return sendSuccess(res, 200, "Manual allocation options", {
    session: { _id: session._id, session: session.session },
    students,
    supervisors,
  });
});

// POST /coordinator/projects/assign-student-supervisor  { studentId, supervisorId }
// Supports allocating before a supervisor has a project, and changing a prior
// direct allocation within the active session.
const assignStudentToSupervisor = asyncHandler(async (req, res) => {
  const { studentId, supervisorId } = req.body;
  if (!studentId || !supervisorId) throw new ApiError(400, "studentId and supervisorId are required");

  const session = await AcademicSession.findOne({ isActive: true });
  if (!session) throw new ApiError(400, "No active academic session");

  const [student, supervisor, project] = await Promise.all([
    User.findOne({ _id: studentId, role: "student" }),
    User.findOne({ _id: supervisorId, role: "supervisor", isDeactivated: false }),
    Project.findOne({ academicSession: session._id, students: studentId }).select("title"),
  ]);
  if (!student) throw new ApiError(404, "Student not found");
  if (!supervisor) throw new ApiError(404, "Active supervisor not found");
  if (project) {
    throw new ApiError(409, `This student is already assigned to the project \"${project.title}\". Change the project assignment instead.`);
  }

  student.assignedSupervisor = supervisor._id;
  student.supervisorAssignmentSession = session._id;
  await student.save();

  await Promise.all([
    notify({ recipient: student._id, title: "Supervisor assigned", message: `You have been assigned to ${supervisor.title ? `${supervisor.title} ` : ""}${supervisor.name}.` }),
    notify({ recipient: supervisor._id, title: "Student assigned", message: `${student.name} has been assigned to you.` }),
    logActivity({
      actor: req.user._id,
      action: "student_assigned_to_supervisor",
      entityType: "user",
      entityId: student._id,
      description: `${student.name} assigned to ${supervisor.name} for ${session.session}`,
    }),
  ]);

  return sendSuccess(res, 200, "Student assigned to supervisor", { student, supervisor, session: session.session });
});

// POST /coordinator/projects/save-supervisor-allocations
// Saves the reviewed browser preview as one allocation action. The server
// re-validates every row so a stale preview can never overwrite a project
// placement or allocate to a deactivated supervisor.
const saveSupervisorAllocations = asyncHandler(async (req, res) => {
  const { assignments } = req.body;
  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw new ApiError(400, "At least one student-supervisor assignment is required");
  }

  const session = await AcademicSession.findOne({ isActive: true });
  if (!session) throw new ApiError(400, "No active academic session");

  const studentIds = assignments.map((assignment) => assignment.studentId);
  const supervisorIds = assignments.map((assignment) => assignment.supervisorId);
  if (studentIds.some((id) => !id) || supervisorIds.some((id) => !id) || new Set(studentIds.map(String)).size !== studentIds.length) {
    throw new ApiError(400, "Each preview row must contain one unique student and one supervisor");
  }

  const [students, supervisors, projectStudentIds] = await Promise.all([
    User.find({ _id: { $in: studentIds }, role: "student" }).select("name"),
    User.find({ _id: { $in: supervisorIds }, role: "supervisor", isDeactivated: false }).select("name title"),
    Project.find({ academicSession: session._id, students: { $in: studentIds } }).distinct("students"),
  ]);
  if (students.length !== studentIds.length) throw new ApiError(400, "One or more students are no longer available");
  if (supervisors.length !== new Set(supervisorIds.map(String)).size) throw new ApiError(400, "One or more supervisors are no longer active");
  if (projectStudentIds.length) throw new ApiError(409, "One or more students were assigned to a project. Refresh the preview and try again.");

  const supervisorById = new Map(supervisors.map((supervisor) => [String(supervisor._id), supervisor]));
  const studentById = new Map(students.map((student) => [String(student._id), student]));
  await User.bulkWrite(assignments.map(({ studentId, supervisorId }) => ({
    updateOne: {
      filter: { _id: studentId, role: "student" },
      update: { assignedSupervisor: supervisorId, supervisorAssignmentSession: session._id },
    },
  })));

  await Promise.all(assignments.flatMap(({ studentId, supervisorId }) => {
    const student = studentById.get(String(studentId));
    const supervisor = supervisorById.get(String(supervisorId));
    const supervisorName = `${supervisor.title ? `${supervisor.title} ` : ""}${supervisor.name}`;
    return [
      notify({ recipient: studentId, title: "Supervisor assigned", message: `You have been assigned to ${supervisorName}.` }),
      notify({ recipient: supervisorId, title: "Student assigned", message: `${student.name} has been assigned to you.` }),
    ];
  }));

  await logActivity({
    actor: req.user._id,
    action: "supervisor_allocations_saved",
    description: `Saved ${assignments.length} student-supervisor allocation(s) for ${session.session}`,
  });

  return sendSuccess(res, 200, "Supervisor allocations saved", { saved: assignments.length });
});

// GET /coordinator/projects/allocation-readiness
const getAllocationReadiness = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Allocation readiness", await getAllocationReadinessData());
});

// POST /coordinator/projects/auto-allocation
const autoAllocation = asyncHandler(async (req, res) => {
  const session = await AcademicSession.findOne({ isActive: true });
  if (!session) throw new ApiError(400, "No active academic session");

  const supervisedProjects = await Project.countDocuments({
    academicSession: session._id,
    supervisor: { $ne: null },
    status: { $ne: "Archived" },
  });
  const students = await getUnassignedStudents(session._id, supervisedProjects > 0);
  const { proposals, skipped } = await runAutoAllocation({ User, students, session, dryRun: false });

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

  const supervisedProjects = await Project.countDocuments({
    academicSession: session._id,
    supervisor: { $ne: null },
    status: { $ne: "Archived" },
  });
  const students = await getUnassignedStudents(session._id, supervisedProjects > 0);
  const { proposals, skipped } = await runAutoAllocation({ User, students, session, dryRun: true });

  return sendSuccess(res, 200, "Allocation preview (not saved)", { proposals, skipped });
});

module.exports = {
  autoAllocation,
  previewAllocation,
  getAllocationReadiness,
  getManualAllocationOptions,
  assignStudentToSupervisor,
  saveSupervisorAllocations,
};
