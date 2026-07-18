const { parse } = require("csv-parse/sync");

/**
 * Parses a CSV buffer into an array of row objects keyed by header.
 * Throws ApiError-friendly errors (caller wraps in try/catch via asyncHandler)
 * on structurally invalid CSV.
 */
const parseCSVBuffer = (buffer) => {
  try {
    const records = parse(buffer, {
      columns: (header) => header.map((h) => h.trim()),
      skip_empty_lines: true,
      trim: true,
    });
    return records;
  } catch (err) {
    const e = new Error("Invalid CSV structure: " + err.message);
    e.statusCode = 400;
    throw e;
  }
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email) => EMAIL_REGEX.test(String(email || "").trim());

module.exports = { parseCSVBuffer, isValidEmail };
