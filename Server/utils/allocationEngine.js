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

  const proposals = [];
  const skipped = [];

  // Track in-memory student counts per project so we don't over-fill within
  // this single run (DB isn't updated yet if dryRun, or updated incrementally otherwise).
  const projectLoad = new Map(projects.map((p) => [String(p._id), p.students.length]));

  for (const student of students) {
    const eligibleProject = projects.find((p) => {
      const load = projectLoad.get(String(p._id));
      return load < maxPerProject && p.projectType !== "Group_Full";
    });

    if (!eligibleProject) {
      skipped.push({ student: student._id, reason: "No project with available capacity" });
      continue;
    }

    const workload = await getSupervisorWorkload(eligibleProject.supervisor._id, session._id);
    if (workload.exceeded) {
      skipped.push({ student: student._id, reason: "Assigned project's supervisor is at capacity" });
      continue;
    }

    proposals.push({ student: student._id, project: eligibleProject._id });
    projectLoad.set(String(eligibleProject._id), projectLoad.get(String(eligibleProject._id)) + 1);

    if (!dryRun) {
      eligibleProject.students.push(student._id);
      await eligibleProject.save();
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
