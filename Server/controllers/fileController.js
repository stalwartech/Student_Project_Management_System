const Attachment = require("../models/Attachment");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { uploadToCloudinary, destroyFromCloudinary } = require("../Config/cloudinary");

// POST /files/upload  (multipart: file)
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "file is required");
  const uploaded = await uploadToCloudinary(req.file, "attachments");

  const attachment = await Attachment.create({
    url: uploaded.secure_url,
    cloudinaryPublicId: uploaded.public_id,
    cloudinaryResourceType: uploaded.resource_type,
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

  return res.redirect(302, file.url);
});

// DELETE /files/:fileId
const deleteFile = asyncHandler(async (req, res) => {
  const file = await Attachment.findById(req.params.fileId);
  if (!file) throw new ApiError(404, "File not found");

  await destroyFromCloudinary(file.cloudinaryPublicId, file.cloudinaryResourceType);

  await file.deleteOne();
  return sendSuccess(res, 200, "File deleted");
});

module.exports = { uploadFile, getFile, downloadFile, deleteFile };
