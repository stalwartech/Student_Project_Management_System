const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const User = require("../models/User");

// Verifies the access token and attaches the user doc to req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Not authenticated - no token provided");
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) throw new ApiError(401, "User no longer exists");
  if (user.isDeactivated) throw new ApiError(403, "Account has been deactivated");

  req.user = user;
  next();
});

// Usage: authorize("coordinator"), authorize("coordinator", "supervisor")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to perform this action"));
  }
  next();
};

// Verifies the short-lived activation/reset token issued after a successful
// OTP verification, and requires it to match the expected `purpose` so an
// "activation" token can't be reused to reset a password, etc.
const requireActivationToken = (purpose) =>
  asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing verification token");
    }
    const token = header.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACTIVATION_TOKEN_SECRET);
    } catch (err) {
      throw new ApiError(401, "Verification token is invalid or expired - please verify the OTP again");
    }

    if (decoded.purpose !== purpose) {
      throw new ApiError(400, "Token was not issued for this action");
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(404, "User not found");

    req.activationUser = user;
    next();
  });

module.exports = { protect, authorize, requireActivationToken };

