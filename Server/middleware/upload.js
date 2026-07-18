const multer = require("multer");
const path = require("path");
const fs = require("fs");

const makeStorage = (subfolder) => {
  const dest = path.join(__dirname, "..", "uploads", subfolder);
  fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
};

const pdfOnly = (req, file, cb) => {
  if (file.mimetype === "application/pdf") return cb(null, true);
  cb(new Error("Only PDF files are allowed"));
};

const imageOrVideo = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    return cb(null, true);
  }
  cb(new Error("Only image or video files are allowed"));
};

const imageOnly = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) return cb(null, true);
  cb(new Error("Only image files are allowed"));
};

const csvOnly = (req, file, cb) => {
  const ok =
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.originalname.toLowerCase().endsWith(".csv");
  if (ok) return cb(null, true);
  cb(new Error("Only CSV files are allowed"));
};

// Chapter submission PDFs
const uploadSubmission = multer({
  storage: makeStorage("submissions"),
  fileFilter: pdfOnly,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Task/checklist evidence (images or short videos)
const uploadEvidence = multer({
  storage: makeStorage("evidence"),
  fileFilter: imageOrVideo,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Profile photos
const uploadPhoto = multer({
  storage: makeStorage("photos"),
  fileFilter: imageOnly,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Generic attachments (messages, misc files)
const uploadAttachment = multer({
  storage: makeStorage("attachments"),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// CSV imports (students / supervisors) - kept in memory, never written to disk
const uploadCSV = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvOnly,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = {
  uploadSubmission,
  uploadEvidence,
  uploadPhoto,
  uploadAttachment,
  uploadCSV,
};
