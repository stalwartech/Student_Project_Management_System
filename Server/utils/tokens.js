const jwt = require("jsonwebtoken");

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

// Short-lived token proving a user just verified an OTP, so create-password /
// reset-password can be called without asking the user to log in first.
const generateActivationToken = (user, purpose) =>
  jwt.sign(
    { id: user._id, purpose },
    process.env.ACTIVATION_TOKEN_SECRET,
    { expiresIn: process.env.ACTIVATION_TOKEN_EXPIRES_IN || "15m" }
  );

const verifyActivationToken = (token) =>
  jwt.verify(token, process.env.ACTIVATION_TOKEN_SECRET);

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/api/auth/refresh-token",
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateActivationToken,
  verifyActivationToken,
  REFRESH_COOKIE_OPTIONS,
};
