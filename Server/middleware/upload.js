const multer = require("multer");
// Files stay in memory only long enough to stream them to Cloudinary.
const cloudStorage = multer.memoryStorage();

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
  storage: cloudStorage,
  fileFilter: pdfOnly,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Task/checklist evidence (images or short videos)
const uploadEvidence = multer({
  storage: cloudStorage,
  fileFilter: imageOrVideo,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Profile photos
const uploadPhoto = multer({
  storage: cloudStorage,
  fileFilter: imageOnly,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Generic attachments (messages, misc files)
const uploadAttachment = multer({
  storage: cloudStorage,
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
