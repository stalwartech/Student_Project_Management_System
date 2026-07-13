const jwt = require("jsonwebtoken");
const User = require("../Model/authModel");

// ─── Protect: Verify JWT and attach user to request ──────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // JWT can come from Authorization header: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized. Please log in." });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB (catches deactivated accounts)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists." });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Your account has been deactivated." });
    }

    // Attach user to request object for downstream use
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token expired. Please log in again." });
    }
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── Role: Restrict access to specific roles ──────────────────────────────
// Usage: authorize("superadmin", "instructor")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };