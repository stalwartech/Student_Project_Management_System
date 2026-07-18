const path = require("path");
const fs = require("fs");
const Attachment = require("../models/Attachment");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");

// POST /files/upload  (multipart: file)
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "file is required");

  const attachment = await Attachment.create({
    url: `/uploads/attachments/${req.file.filename}`,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user._id,
    task: req.body.task || undefined,
    chapterSubmission: req.body.chapterSubmission || undefined,
    message: req.body.message || undefined,
  });

  return sendSuccess(res, 201, "File uploaded", attachment);
});

// GET /files/:fileId
const getFile = asyncHandler(async (req, res) => {
  const file = await Attachment.findById(req.params.fileId);
  if (!file) throw new ApiError(404, "File not found");
  return sendSuccess(res, 200, "File", file);
});

// GET /files/:fileId/download
const downloadFile = asyncHandler(async (req, res) => {
  const file = await Attachment.findById(req.params.fileId);
  if (!file) throw new ApiError(404, "File not found");

  const filePath = path.join(__dirname, "..", file.url.replace(/^\/uploads/, "uploads"));
  return res.download(filePath, file.fileName || undefined);
});

// DELETE /files/:fileId
const deleteFile = asyncHandler(async (req, res) => {
  const file = await Attachment.findById(req.params.fileId);
  if (!file) throw new ApiError(404, "File not found");

  const filePath = path.join(__dirname, "..", file.url.replace(/^\/uploads/, "uploads"));
  fs.unlink(filePath, () => {}); // best-effort disk cleanup, doesn't block the DB delete

  await file.deleteOne();
  return sendSuccess(res, 200, "File deleted");
});

module.exports = { uploadFile, getFile, downloadFile, deleteFile };
