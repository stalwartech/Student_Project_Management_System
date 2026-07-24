const Project = require("../models/Project");
const SupervisorLimit = require("../models/SupervisorLimit");
const Settings = require("../models/Settings");

const DEFAULT_SUPERVISOR_LIMIT = 5;
const DEFAULT_STUDENTS_PER_PROJECT = 4;

/**
 * Resolves the max project count a supervisor should carry:
 * per-supervisor override (SupervisorLimit) > global Settings default > hardcoded fallback.
 */
const getSupervisorLimit = async (supervisorId) => {
  const override = await SupervisorLimit.findOne({ supervisor: supervisorId });
  if (override) return override.limit;

  const settings = await Settings.findOne();
  return settings?.defaultSupervisorLimit ?? DEFAULT_SUPERVISOR_LIMIT;
};

const getMaxStudentsPerProject = async () => {
  const settings = await Settings.findOne();
  return settings?.defaultStudentLimit ?? DEFAULT_STUDENTS_PER_PROJECT;
};

/**
 * Returns { currentLoad, limit, exceeded } for a supervisor.
 * Used for the SOFT check on manual assignment (warn but allow) and the
 * HARD check during auto allocation (skip if it would exceed).
 */
const getSupervisorWorkload = async (supervisorId, academicSession) => {
  const currentLoad = await Project.countDocuments({
    supervisor: supervisorId,
    academicSession,
    status: { $ne: "Archived" },
  });
  const limit = await getSupervisorLimit(supervisorId);
  return { currentLoad, limit, exceeded: currentLoad >= limit };
};

const getSupervisorStudentLoad = async (User, supervisorId, academicSession) =>
  User.countDocuments({
    role: "student",
    assignedSupervisor: supervisorId,
    supervisorAssignmentSession: academicSession,
  });

/**
 * Smart Auto Allocation: assigns unassigned students in an active session to
 * projects that (a) belong to that session, (b) aren't full, and whose
 * supervisor (c) isn't at their HARD limit. This is a straightforward
 * greedy allocator - swap in a smarter matching strategy later if needed.
 *
 * dryRun=true returns the proposed assignments without writing to the DB
 * (backs the "preview allocation" endpoint).
 */
const runAutoAllocation = async ({ User, students, session, dryRun = false }) => {
  const maxPerProject = await getMaxStudentsPerProject();

  const projects = await Project.find({
    academicSession: session._id,
    status: { $ne: "Archived" },
  }).populate("supervisor");

  const supervisors = await User.find({ role: "supervisor", isDeactivated: false });

  const proposals = [];
  const skipped = [];

  // Track in-memory student counts per project so we don't over-fill within
  // this single run (DB isn't updated yet if dryRun, or updated incrementally otherwise).
  const projectLoad = new Map(projects.map((p) => [String(p._id), p.students.length]));
  const directSupervisorLoad = new Map();
  for (const supervisor of supervisors) {
    directSupervisorLoad.set(String(supervisor._id), await getSupervisorStudentLoad(User, supervisor._id, session._id));
  }

  for (const student of students) {
    let eligibleProject = null;

    // Do not stop at the first project with space: its supervisor can be at
    // capacity, while a later project remains available. Projects that have
    // not yet been assigned a supervisor are not valid auto-allocation targets.
    for (const project of projects) {
      const load = projectLoad.get(String(project._id));
      if (load >= maxPerProject || !project.supervisor) continue;
      if (student.assignedSupervisor && String(student.assignedSupervisor) !== String(project.supervisor._id)) continue;

      const workload = await getSupervisorWorkload(project.supervisor._id, session._id);
      if (!workload.exceeded) {
        eligibleProject = project;
        break;
      }
    }

    if (!eligibleProject) {
      // Supervisors can receive students before they create projects. Balance
      // those direct allocations so the coordinator can run allocation first.
      if (projects.length === 0 && supervisors.length) {
        const supervisor = supervisors.reduce((leastLoaded, candidate) =>
          directSupervisorLoad.get(String(candidate._id)) < directSupervisorLoad.get(String(leastLoaded._id))
            ? candidate
            : leastLoaded
        );
        proposals.push({ student: student._id, supervisor: supervisor._id, mode: "supervisor" });
        directSupervisorLoad.set(String(supervisor._id), directSupervisorLoad.get(String(supervisor._id)) + 1);
        if (!dryRun) {
          student.assignedSupervisor = supervisor._id;
          student.supervisorAssignmentSession = session._id;
          await student.save();
        }
        continue;
      }

      skipped.push({ student: student._id, reason: "No matching supervised project with available capacity" });
      continue;
    }

    proposals.push({ student: student._id, project: eligibleProject._id, supervisor: eligibleProject.supervisor._id, mode: "project" });
    projectLoad.set(String(eligibleProject._id), projectLoad.get(String(eligibleProject._id)) + 1);

    if (!dryRun) {
      eligibleProject.students.push(student._id);
      await eligibleProject.save();
      student.assignedSupervisor = eligibleProject.supervisor._id;
      student.supervisorAssignmentSession = session._id;
      await student.save();
    }
  }

  return { proposals, skipped };
};

module.exports = {
  getSupervisorLimit,
  getMaxStudentsPerProject,
  getSupervisorWorkload,
  runAutoAllocation,
};
