class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Standard success envelope: { success, message, data }
const sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({ success: true, message, data });
};

module.exports = { ApiError, sendSuccess };
