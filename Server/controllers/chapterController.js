const Chapter = require("../models/Chapter");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const logActivity = require("../utils/logActivity");

const sameId = (left, right) => String(left) === String(right);

const assertChapterAccess = async (user, chapter) => {
  const project = await Project.findById(chapter.project);
  if (!project) throw new ApiError(404, "Project not found");
  const isStudent = project.students.some((student) => sameId(student, user._id));
  const isSupervisor = project.supervisor && sameId(project.supervisor, user._id);
  if (user.role !== "coordinator" && !isStudent && !isSupervisor) {
    throw new ApiError(403, "You do not have access to this chapter");
  }
  return { project, isStudent, isSupervisor };
};

const createChapter = asyncHandler(async (req, res) => {
  const { title, project, chapterNumber, deadline, priority } = req.body;
  if (!title || !project) throw new ApiError(400, "title and project are required");
  const projectDoc = await Project.findById(project);
  if (!projectDoc) throw new ApiError(404, "Project not found");
  if (!projectDoc.students.some((student) => sameId(student, req.user._id))) {
    throw new ApiError(403, "You can only create chapters for your assigned project");
  }
  if (projectDoc.isLocked) throw new ApiError(403, "This project is locked");
  const chapter = await Chapter.create({ title, project, chapterNumber, deadline, priority, createdBy: req.user._id });
  return sendSuccess(res, 201, "Chapter created", chapter);
});

const getChapters = asyncHandler(async (req, res) => {
  const query = req.query.project ? { project: req.query.project } : {};
  let chapters = await Chapter.find(query).sort({ chapterNumber: 1 });
  if (req.user.role !== "coordinator") {
    const projectQuery = req.user.role === "student" ? { students: req.user._id } : { supervisor: req.user._id };
    const projects = await Project.find(projectQuery).select("_id");
    const ids = new Set(projects.map((project) => String(project._id)));
    chapters = chapters.filter((chapter) => ids.has(String(chapter.project)));
  }
  return sendSuccess(res, 200, "Chapters", chapters);
});

const getChapterById = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  await assertChapterAccess(req.user, chapter);
  return sendSuccess(res, 200, "Chapter", chapter);
});

const updateChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  const { project, isStudent } = await assertChapterAccess(req.user, chapter);
  if (!isStudent || chapter.isLocked || project.isLocked) throw new ApiError(403, "This chapter is locked or does not belong to you");
  const allowed = ["title", "chapterNumber", "deadline", "priority", "status", "startDate"];
  Object.assign(chapter, Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key))));
  await chapter.save();
  return sendSuccess(res, 200, "Chapter updated", chapter);
});

const deleteChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  const { project, isStudent } = await assertChapterAccess(req.user, chapter);
  if (!isStudent || chapter.isLocked || project.isLocked) throw new ApiError(403, "This chapter cannot be deleted");
  await chapter.deleteOne();
  return sendSuccess(res, 200, "Chapter deleted");
});

const setLock = (isLocked) => asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  const { isSupervisor } = await assertChapterAccess(req.user, chapter);
  if (!isSupervisor) throw new ApiError(403, "Only the assigned supervisor can change this lock");
  chapter.isLocked = isLocked;
  await chapter.save();
  return sendSuccess(res, 200, `Chapter ${isLocked ? "locked" : "unlocked"}`, chapter);
});

const lockChapter = setLock(true);
const unlockChapter = setLock(false);

const completeChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  const { isSupervisor } = await assertChapterAccess(req.user, chapter);
  if (!isSupervisor) throw new ApiError(403, "Only the assigned supervisor can complete this chapter");
  chapter.status = "Completed";
  chapter.completionDate = new Date();
  await chapter.save();
  await logActivity({ actor: req.user._id, action: "chapter_completed", entityType: "chapter", entityId: chapter._id, project: chapter.project });
  return sendSuccess(res, 200, "Chapter marked complete", chapter);
});

module.exports = { createChapter, getChapters, getChapterById, updateChapter, deleteChapter, lockChapter, unlockChapter, completeChapter };
