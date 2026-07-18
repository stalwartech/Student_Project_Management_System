const crypto = require("crypto");
const OTPModel = require("../models/OTPModel");

const generateOTPCode = () =>
  String(crypto.randomInt(0, 1000000)).padStart(6, "0");

/**
 * Creates (and persists) a fresh OTP for a user + purpose.
 * Invalidates any previous unverified OTPs of the same purpose for that user
 * so a user can't have multiple valid codes floating around.
 */
const createOTP = async (userId, purpose) => {
  await OTPModel.deleteMany({ user: userId, purpose, verified: false });

  const code = generateOTPCode();
  const minutes = Number(process.env.OTP_EXPIRES_IN_MINUTES || 10);

  const otp = await OTPModel.create({
    user: userId,
    code,
    purpose,
    expiresAt: new Date(Date.now() + minutes * 60 * 1000),
  });

  return otp;
};

/**
 * Verifies a submitted code. Returns the OTP doc on success, throws-free —
 * caller decides how to respond (keeps this reusable in different flows).
 */
const findValidOTP = async (userId, purpose, code) => {
  return OTPModel.findOne({
    user: userId,
    purpose,
    code,
    verified: false,
    expiresAt: { $gt: new Date() },
  });
};

module.exports = { generateOTPCode, createOTP, findValidOTP };
