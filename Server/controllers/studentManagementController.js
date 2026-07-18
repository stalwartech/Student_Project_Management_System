const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { notify } = require("../utils/notify");
const logActivity = require("../utils/logActivity");

// GET /coordinator/students
const getStudents = asyncHandler(async (req, res) => {
  const { search, department, level, activated, page = 1, limit = 20 } = req.query;

  const query = { role: "student" };
  if (search) query.name = { $regex: search, $options: "i" };
  if (department) query.department = department;
  if (level) query.level = level;
  if (activated !== undefined) query.isActivated = activated === "true";

  const skip = (Number(page) - 1) * Number(limit);
  const [students, total] = await Promise.all([
    User.find(query).select("-password").skip(skip).limit(Number(limit)).sort({ name: 1 }),
    User.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Students", { students, total, page: Number(page), limit: Number(limit) });
});

// GET /coordinator/students/:studentId
const getStudentById = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.studentId, role: "student" });
  if (!student) throw new ApiError(404, "Student not found");
  return sendSuccess(res, 200, "Student", student);
});

// PATCH /coordinator/students/:studentId/activate
// Reactivates a deactivated account (distinct from the OTP self-activation flow).
const activateStudent = asyncHandler(async (req, res) => {
  const student = await User.findOneAndUpdate(
    { _id: req.params.studentId, role: "student" },
    { isDeactivated: false },
    { new: true }
  );
  if (!student) throw new ApiError(404, "Student not found");

  await notify({ recipient: student._id, title: "Account reactivated", message: "Your account has been reactivated by the coordinator." });
  await logActivity({ actor: req.user._id, action: "student_activated_by_coordinator", entityType: "user", entityId: student._id });

  return sendSuccess(res, 200, "Student activated", student);
});

// PATCH /coordinator/students/:studentId/deactivate
const deactivateStudent = asyncHandler(async (req, res) => {
  const student = await User.findOneAndUpdate(
    { _id: req.params.studentId, role: "student" },
    { isDeactivated: true },
    { new: true }
  );
  if (!student) throw new ApiError(404, "Student not found");

  await logActivity({ actor: req.user._id, action: "student_deactivated", entityType: "user", entityId: student._id });

  return sendSuccess(res, 200, "Student deactivated", student);
});

module.exports = { getStudents, getStudentById, activateStudent, deactivateStudent };
