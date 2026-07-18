const Settings = require("../models/Settings");
const SupervisorLimit = require("../models/SupervisorLimit");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");

// Ensures exactly one Settings document exists, creating it on first access.
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
};

// GET /settings
const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  return sendSuccess(res, 200, "Settings", settings);
});

// PATCH /settings
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  Object.assign(settings, req.body, { updatedBy: req.user._id });
  await settings.save();
  return sendSuccess(res, 200, "Settings updated", settings);
});

// PATCH /settings/project-limit  { defaultProjectLimit }
const updateProjectLimit = asyncHandler(async (req, res) => {
  const { defaultProjectLimit } = req.body;
  if (defaultProjectLimit === undefined) throw new ApiError(400, "defaultProjectLimit is required");
  const settings = await getOrCreateSettings();
  settings.defaultProjectLimit = defaultProjectLimit;
  settings.updatedBy = req.user._id;
  await settings.save();
  return sendSuccess(res, 200, "Project limit updated", settings);
});

// PATCH /settings/supervisor-limit  { defaultSupervisorLimit } OR { supervisorId, limit } for a per-supervisor override
const updateSupervisorLimit = asyncHandler(async (req, res) => {
  const { supervisorId, limit, defaultSupervisorLimit } = req.body;

  if (supervisorId && limit !== undefined) {
    const override = await SupervisorLimit.findOneAndUpdate(
      { supervisor: supervisorId },
      { limit, setBy: req.user._id },
      { new: true, upsert: true }
    );
    return sendSuccess(res, 200, "Supervisor limit override set", override);
  }

  if (defaultSupervisorLimit === undefined) {
    throw new ApiError(400, "Provide either { supervisorId, limit } or { defaultSupervisorLimit }");
  }
  const settings = await getOrCreateSettings();
  settings.defaultSupervisorLimit = defaultSupervisorLimit;
  settings.updatedBy = req.user._id;
  await settings.save();
  return sendSuccess(res, 200, "Default supervisor limit updated", settings);
});

// PATCH /settings/student-limit  { defaultStudentLimit }
const updateStudentLimit = asyncHandler(async (req, res) => {
  const { defaultStudentLimit } = req.body;
  if (defaultStudentLimit === undefined) throw new ApiError(400, "defaultStudentLimit is required");
  const settings = await getOrCreateSettings();
  settings.defaultStudentLimit = defaultStudentLimit;
  settings.updatedBy = req.user._id;
  await settings.save();
  return sendSuccess(res, 200, "Student limit updated", settings);
});

// PATCH /settings/auto-allocation  { autoAllocationEnabled }
const updateAutoAllocation = asyncHandler(async (req, res) => {
  const { autoAllocationEnabled } = req.body;
  if (typeof autoAllocationEnabled !== "boolean") throw new ApiError(400, "autoAllocationEnabled must be a boolean");
  const settings = await getOrCreateSettings();
  settings.autoAllocationEnabled = autoAllocationEnabled;
  settings.updatedBy = req.user._id;
  await settings.save();
  return sendSuccess(res, 200, "Auto-allocation setting updated", settings);
});

module.exports = {
  getSettings,
  updateSettings,
  updateProjectLimit,
  updateSupervisorLimit,
  updateStudentLimit,
  updateAutoAllocation,
};
