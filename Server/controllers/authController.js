const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { parseCSVBuffer, isValidEmail } = require("../utils/csvParser");
const { createOTP, findValidOTP } = require("../utils/otp");
const sendEmail = require("../utils/sendEmail");
const { welcomeEmail, otpEmail } = require("../utils/emailTemplates");
const {
  generateAccessToken,
  generateRefreshToken,
  generateActivationToken,
  REFRESH_COOKIE_OPTIONS,
} = require("../utils/tokens");
const jwt = require("jsonwebtoken");
const logActivity = require("../utils/logActivity");

const REQUIRED_STUDENT_FIELDS = ["Full Name", "Matric Number", "Email Address", "Gender", "Level", "Department"];
const REQUIRED_SUPERVISOR_FIELDS = ["Title", "Full Name", "Staff ID", "Department", "Email Address", "Gender"];

/**
 * Shared CSV import routine for both students and supervisors.
 * Validates every row, buckets results into imported/duplicate/invalid/missing,
 * and only persists rows that pass every check - matching the spec's import
 * summary + "only valid records saved" behaviour exactly.
 */
const importUsers = async ({ rows, role, requiredFields, req }) => {
  const summary = { imported: [], duplicates: [], invalid: [], missing: [] };

  // Pre-fetch existing emails/matrics/staffIds once instead of a query per row.
  const existingEmails = new Set((await User.find({}, "email")).map((u) => u.email.toLowerCase()));
  const existingMatrics = new Set(
    (await User.find({ matric: { $exists: true } }, "matric")).map((u) => u.matric)
  );
  const existingStaffIds = new Set(
    (await User.find({ staffId: { $exists: true } }, "staffId")).map((u) => u.staffId)
  );

  const seenEmailsInFile = new Set();
  const seenIdsInFile = new Set();
  const toCreate = [];

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2; // +1 for header row, +1 for 1-based
    const missingFields = requiredFields.filter((f) => !row[f] || !String(row[f]).trim());
    if (missingFields.length) {
      summary.missing.push({ row: rowNumber, missingFields });
      continue;
    }

    const email = row["Email Address"].trim().toLowerCase();
    if (!isValidEmail(email)) {
      summary.invalid.push({ row: rowNumber, reason: "Invalid email format" });
      continue;
    }

    const idField = role === "student" ? row["Matric Number"].trim() : row["Staff ID"].trim();
    const idKey = role === "student" ? "matric" : "staffId";
    const existingIdSet = role === "student" ? existingMatrics : existingStaffIds;

    if (
      existingEmails.has(email) ||
      seenEmailsInFile.has(email) ||
      existingIdSet.has(idField) ||
      seenIdsInFile.has(idField)
    ) {
      summary.duplicates.push({ row: rowNumber, email, [idKey]: idField });
      continue;
    }

    seenEmailsInFile.add(email);
    seenIdsInFile.add(idField);

    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const userDoc = {
      name: row["Full Name"].trim(),
      email,
      password: hashedPassword,
      gender: row["Gender"].trim(),
      department: row["Department"].trim(),
      phone: row["Phone Number"]?.trim() || undefined,
      whatsapp: row["WhatsApp Number"]?.trim() || undefined,
      role,
      isActivated: false,
    };

    if (role === "student") {
      userDoc.matric = idField;
      userDoc.level = row["Level"].trim();
    } else {
      userDoc.staffId = idField;
      userDoc.title = row["Title"].trim();
    }

    toCreate.push(userDoc);
  }

  if (toCreate.length) {
    const created = await User.insertMany(toCreate, { ordered: false });
    summary.imported = created.map((u) => ({ id: u._id, name: u.name, email: u.email }));

    // Students receive their activation email immediately. Supervisors request
    // their OTP themselves from the activation screen using a staff ID or
    // email, so adding a supervisor never sends an unsolicited token.
    if (role === "student") {
      await Promise.all(created.map(async (user) => {
        try {
          const otp = await createOTP(user._id, "activation");
          const { subject, html } = welcomeEmail({
            name: user.name,
            portalLink: `${process.env.CLIENT_URL}/activate`,
            otpCode: otp.code,
          });
          await sendEmail({ to: user.email, subject, html });
        } catch (err) {
          console.error(`Failed to send welcome email to ${user.email}:`, err.message);
        }
      }));
    }

    await logActivity({
      actor: req.user._id,
      action: role === "student" ? "students_imported" : "supervisors_imported",
      entityType: "user",
      description: `Imported ${created.length} ${role}(s)`,
    });
  }

  return summary;
};

// POST /auth/import/students
const importStudents = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "CSV file is required");
  const rows = parseCSVBuffer(req.file.buffer);
  const summary = await importUsers({ rows, role: "student", requiredFields: REQUIRED_STUDENT_FIELDS, req });
  return sendSuccess(res, 200, "Student import processed", summary);
});

// POST /auth/import/supervisors
const importSupervisors = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "CSV file is required");
  const rows = parseCSVBuffer(req.file.buffer);
  const summary = await importUsers({ rows, role: "supervisor", requiredFields: REQUIRED_SUPERVISOR_FIELDS, req });
  return sendSuccess(res, 200, "Supervisor import processed", summary);
});

const findActivationUser = (identifier) => {
  const value = identifier.trim();
  if (value.includes("@")) return User.findOne({ email: value.toLowerCase() });
  return User.findOne({ $or: [{ matric: value }, { staffId: value }] });
};

// POST /auth/activate  { identifier }  -> sends activation OTP
const activate = asyncHandler(async (req, res) => {
  // `matric` is retained for existing student clients during the transition.
  const identifier = req.body.identifier || req.body.matric;
  if (!identifier) throw new ApiError(400, "An email, matric number, or staff ID is required");

  const user = await findActivationUser(identifier);
  if (!user) throw new ApiError(404, "No account found for those details");
  if (user.isActivated) throw new ApiError(400, "Account is already activated");

  const otp = await createOTP(user._id, "activation");
  const { subject, html } = otpEmail({ name: user.name, otpCode: otp.code, purpose: "account activation" });
  await sendEmail({ to: user.email, subject, html });

  return sendSuccess(res, 200, "OTP sent to your registered email");
});

// POST /auth/verify-otp  { identifier, code }  -> returns a short-lived activation token
const verifyOTP = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier || req.body.matric;
  const { code } = req.body;
  if (!identifier || !code) throw new ApiError(400, "identifier and code are required");

  const user = await findActivationUser(identifier);
  if (!user) throw new ApiError(404, "User not found");

  const otp = await findValidOTP(user._id, "activation", code);
  if (!otp) throw new ApiError(400, "Invalid or expired OTP");

  otp.verified = true;
  await otp.save();

  const activationToken = generateActivationToken(user, "activation");
  return sendSuccess(res, 200, "OTP verified", { activationToken });
});

// POST /auth/create-password  (Bearer activationToken)  { password }
const createPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const user = req.activationUser;
  user.password = await bcrypt.hash(password, 10);
  user.isActivated = true;
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();
  await user.save();

  await logActivity({
    actor: user._id,
    action: "account_activated",
    entityType: "user",
    entityId: user._id,
    description: `${user.name} activated their account`,
  });

  return sendSuccess(res, 200, "Account activated - you can now log in");
});

// POST /auth/login  { identifier, password }  - identifier is an email, matric number, or staff ID
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new ApiError(400, "identifier and password are required");

  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { $or: [{ matric: identifier }, { staffId: identifier }] };
  const user = await User.findOne(query).select("+password");

  if (!user) throw new ApiError(401, "Invalid credentials");
  if (user.isDeactivated) throw new ApiError(403, "Account has been deactivated");
  if (!user.isActivated) throw new ApiError(403, "Account is not activated yet");

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    await user.save();
    throw new ApiError(401, "Invalid credentials");
  }

  user.failedLoginAttempts = 0;
  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

  await logActivity({ actor: user._id, action: "login", entityType: "user", entityId: user._id });

  const safeUser = user.toObject();
  delete safeUser.password;

  return sendSuccess(res, 200, "Login successful", {
    accessToken,
    user: safeUser,
  });
});

// POST /auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", { path: "/api/auth/refresh-token" });
  return sendSuccess(res, 200, "Logged out");
});

// POST /auth/forgot-password  { identifier }
const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) throw new ApiError(400, "identifier is required");

  const query = identifier.includes("@") ? { email: identifier.toLowerCase() } : { matric: identifier };
  const user = await User.findOne(query);

  // Deliberately vague response so this endpoint can't be used to enumerate accounts.
  if (!user) return sendSuccess(res, 200, "If an account exists, an OTP has been sent");

  const otp = await createOTP(user._id, "password_reset");
  const { subject, html } = otpEmail({ name: user.name, otpCode: otp.code, purpose: "password reset" });
  await sendEmail({ to: user.email, subject, html });

  return sendSuccess(res, 200, "If an account exists, an OTP has been sent");
});

// POST /auth/verify-reset-otp  { identifier, code }
const verifyResetOTP = asyncHandler(async (req, res) => {
  const { identifier, code } = req.body;
  if (!identifier || !code) throw new ApiError(400, "identifier and code are required");

  const query = identifier.includes("@") ? { email: identifier.toLowerCase() } : { matric: identifier };
  const user = await User.findOne(query);
  if (!user) throw new ApiError(400, "Invalid or expired OTP");

  const otp = await findValidOTP(user._id, "password_reset", code);
  if (!otp) throw new ApiError(400, "Invalid or expired OTP");

  otp.verified = true;
  await otp.save();

  const activationToken = generateActivationToken(user, "password_reset");
  return sendSuccess(res, 200, "OTP verified", { activationToken });
});

// POST /auth/reset-password  (Bearer activationToken)  { password }
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

  const user = req.activationUser;
  user.password = await bcrypt.hash(password, 10);
  user.passwordChangedAt = new Date();
  await user.save();

  return sendSuccess(res, 200, "Password reset successful - you can now log in");
});

// PATCH /auth/change-password  (protect)  { oldPassword, newPassword }
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) throw new ApiError(400, "oldPassword and newPassword are required");
  if (newPassword.length < 8) throw new ApiError(400, "New password must be at least 8 characters");

  const user = await User.findById(req.user._id).select("+password");
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new ApiError(401, "Current password is incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordChangedAt = new Date();
  user.mustChangePassword = false;
  await user.save();

  return sendSuccess(res, 200, "Password changed successfully");
});

// GET /auth/me  (protect)
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Current user", req.user);
});

// POST /auth/refresh-token
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "No refresh token provided");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id);
  if (!user || user.isDeactivated) throw new ApiError(401, "User no longer valid");

  const accessToken = generateAccessToken(user);
  return sendSuccess(res, 200, "Token refreshed", { accessToken });
});

module.exports = {
  importStudents,
  importSupervisors,
  activate,
  verifyOTP,
  createPassword,
  login,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  changePassword,
  getMe,
  refreshToken,
};
