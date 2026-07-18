const User = require("../models/User");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { getSupervisorWorkload } = require("../utils/allocationEngine");
const logActivity = require("../utils/logActivity");

// GET /coordinator/supervisors
const getSupervisors = asyncHandler(async (req, res) => {
  const { search, department, page = 1, limit = 20 } = req.query;

  const query = { role: "supervisor" };
  if (search) query.name = { $regex: search, $options: "i" };
  if (department) query.department = department;

  const skip = (Number(page) - 1) * Number(limit);
  const [supervisors, total] = await Promise.all([
    User.find(query).select("-password").skip(skip).limit(Number(limit)).sort({ name: 1 }),
    User.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Supervisors", { supervisors, total, page: Number(page), limit: Number(limit) });
});

// GET /coordinator/supervisors/:supervisorId
const getSupervisorById = asyncHandler(async (req, res) => {
  const supervisor = await User.findOne({ _id: req.params.supervisorId, role: "supervisor" });
  if (!supervisor) throw new ApiError(404, "Supervisor not found");
  return sendSuccess(res, 200, "Supervisor", supervisor);
});

// PATCH /coordinator/supervisors/:supervisorId  - was missing from the original routes ("Edit supervisor information" in the spec)
const updateSupervisor = asyncHandler(async (req, res) => {
  const disallowed = ["password", "role", "email"]; // updated through dedicated auth flows only
  disallowed.forEach((field) => delete req.body[field]);

  const supervisor = await User.findOneAndUpdate(
    { _id: req.params.supervisorId, role: "supervisor" },
    req.body,
    { new: true, runValidators: true }
  );
  if (!supervisor) throw new ApiError(404, "Supervisor not found");

  await logActivity({ actor: req.user._id, action: "supervisor_updated", entityType: "user", entityId: supervisor._id });

  return sendSuccess(res, 200, "Supervisor updated", supervisor);
});

// GET /coordinator/supervisors/:supervisorId/workload  - was missing from the original routes ("View supervisor workload" in the spec)
const getSupervisorWorkloadInfo = asyncHandler(async (req, res) => {
  const supervisor = await User.findOne({ _id: req.params.supervisorId, role: "supervisor" });
  if (!supervisor) throw new ApiError(404, "Supervisor not found");

  const projects = await Project.find({ supervisor: supervisor._id }).select("title status academicSession");
  const workload = await getSupervisorWorkload(supervisor._id, req.query.academicSession);

  return sendSuccess(res, 200, "Supervisor workload", { ...workload, projects });
});

// PATCH /coordinator/supervisors/:supervisorId/activate
const activateSupervisor = asyncHandler(async (req, res) => {
  const supervisor = await User.findOneAndUpdate(
    { _id: req.params.supervisorId, role: "supervisor" },
    { isDeactivated: false },
    { new: true }
  );
  if (!supervisor) throw new ApiError(404, "Supervisor not found");
  return sendSuccess(res, 200, "Supervisor activated", supervisor);
});

// PATCH /coordinator/supervisors/:supervisorId/deactivate
const deactivateSupervisor = asyncHandler(async (req, res) => {
  const supervisor = await User.findOneAndUpdate(
    { _id: req.params.supervisorId, role: "supervisor" },
    { isDeactivated: true },
    { new: true }
  );
  if (!supervisor) throw new ApiError(404, "Supervisor not found");
  return sendSuccess(res, 200, "Supervisor deactivated", supervisor);
});

module.exports = {
  getSupervisors,
  getSupervisorById,
  updateSupervisor,
  getSupervisorWorkloadInfo,
  activateSupervisor,
  deactivateSupervisor,
};
