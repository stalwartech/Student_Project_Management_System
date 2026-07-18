const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { createOTP, findValidOTP } = require("../utils/otp");
const sendEmail = require("../utils/sendEmail");
const { otpEmail } = require("../utils/emailTemplates");

const ALLOWED_PURPOSES = ["activation", "password_reset", "email_verification", "email_change"];

// POST /otp/send  (protect)  { purpose }
const sendOTP = asyncHandler(async (req, res) => {
  const { purpose } = req.body;
  if (!ALLOWED_PURPOSES.includes(purpose)) throw new ApiError(400, "Invalid purpose");

  const otp = await createOTP(req.user._id, purpose);
  const { subject, html } = otpEmail({ name: req.user.name, otpCode: otp.code, purpose });
  await sendEmail({ to: req.user.email, subject, html });

  return sendSuccess(res, 200, "OTP sent");
});

// POST /otp/verify  (protect)  { purpose, code }
const verifyOTP = asyncHandler(async (req, res) => {
  const { purpose, code } = req.body;
  if (!purpose || !code) throw new ApiError(400, "purpose and code are required");

  const otp = await findValidOTP(req.user._id, purpose, code);
  if (!otp) throw new ApiError(400, "Invalid or expired OTP");

  otp.verified = true;
  await otp.save();

  return sendSuccess(res, 200, "OTP verified");
});

// POST /otp/resend  (protect)  { purpose }
const resendOTP = asyncHandler(async (req, res) => {
  const { purpose } = req.body;
  if (!ALLOWED_PURPOSES.includes(purpose)) throw new ApiError(400, "Invalid purpose");

  const otp = await createOTP(req.user._id, purpose);
  const { subject, html } = otpEmail({ name: req.user.name, otpCode: otp.code, purpose });
  await sendEmail({ to: req.user.email, subject, html });

  return sendSuccess(res, 200, "OTP resent");
});

module.exports = { sendOTP, verifyOTP, resendOTP };
