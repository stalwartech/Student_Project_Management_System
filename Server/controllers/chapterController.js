const Chapter = require("../models/Chapter");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const logActivity = require("../utils/logActivity");

// POST /chapters
const createChapter = asyncHandler(async (req, res) => {
  const { title, project, chapterNumber, deadline, priority } = req.body;
  if (!title || !project) throw new ApiError(400, "title and project are required");

  const chapter = await Chapter.create({
    title,
    project,
    chapterNumber,
    deadline,
    priority,
    createdBy: req.user._id,
  });

  return sendSuccess(res, 201, "Chapter created", chapter);
});

// GET /chapters?project=:projectId
const getChapters = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.project) query.project = req.query.project;
  const chapters = await Chapter.find(query).sort({ chapterNumber: 1 });
  return sendSuccess(res, 200, "Chapters", chapters);
});

// GET /chapters/:chapterId
const getChapterById = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  return sendSuccess(res, 200, "Chapter", chapter);
});

// PATCH /chapters/:chapterId
const updateChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findByIdAndUpdate(req.params.chapterId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!chapter) throw new ApiError(404, "Chapter not found");
  return sendSuccess(res, 200, "Chapter updated", chapter);
});

// DELETE /chapters/:chapterId
const deleteChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findByIdAndDelete(req.params.chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  return sendSuccess(res, 200, "Chapter deleted");
});

// PATCH /chapters/:chapterId/lock
const lockChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findByIdAndUpdate(req.params.chapterId, { isLocked: true }, { new: true });
  if (!chapter) throw new ApiError(404, "Chapter not found");
  return sendSuccess(res, 200, "Chapter locked", chapter);
});

// PATCH /chapters/:chapterId/unlock
const unlockChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findByIdAndUpdate(req.params.chapterId, { isLocked: false }, { new: true });
  if (!chapter) throw new ApiError(404, "Chapter not found");
  return sendSuccess(res, 200, "Chapter unlocked", chapter);
});

// PATCH /chapters/:chapterId/complete
const completeChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findByIdAndUpdate(
    req.params.chapterId,
    { status: "Completed", completionDate: new Date() },
    { new: true }
  );
  if (!chapter) throw new ApiError(404, "Chapter not found");

  await logActivity({
    actor: req.user._id,
    action: "chapter_completed",
    entityType: "chapter",
    entityId: chapter._id,
    project: chapter.project,
  });

  return sendSuccess(res, 200, "Chapter marked complete", chapter);
});

module.exports = {
  createChapter,
  getChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  lockChapter,
  unlockChapter,
  completeChapter,
};
