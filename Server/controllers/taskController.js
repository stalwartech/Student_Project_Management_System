const fs = require("fs");
const path = require("path");
const Task = require("../models/Task");
const Attachment = require("../models/Attachment");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");

// POST /tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, chapter, description, deadline, taskNumber } = req.body;
  if (!title || !chapter) throw new ApiError(400, "title and chapter are required");

  const task = await Task.create({ title, chapter, description, deadline, taskNumber, createdBy: req.user._id });
  return sendSuccess(res, 201, "Task created", task);
});

// GET /tasks?chapter=
const getTasks = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.chapter) query.chapter = req.query.chapter;
  const tasks = await Task.find(query).sort({ taskNumber: 1 });
  return sendSuccess(res, 200, "Tasks", tasks);
});

// GET /tasks/:taskId
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new ApiError(404, "Task not found");
  return sendSuccess(res, 200, "Task", task);
});

// PATCH /tasks/:taskId
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.taskId,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!task) throw new ApiError(404, "Task not found");
  return sendSuccess(res, 200, "Task updated", task);
});

// DELETE /tasks/:taskId
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.taskId);
  if (!task) throw new ApiError(404, "Task not found");
  return sendSuccess(res, 200, "Task deleted");
});

// PATCH /tasks/:taskId/complete
const completeTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(
    req.params.taskId,
    { status: "Completed", completionDate: new Date() },
    { new: true }
  );
  if (!task) throw new ApiError(404, "Task not found");
  return sendSuccess(res, 200, "Task marked complete", task);
});

// PATCH /tasks/:taskId/status  { status }
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new ApiError(400, "status is required");
  const task = await Task.findByIdAndUpdate(req.params.taskId, { status }, { new: true });
  if (!task) throw new ApiError(404, "Task not found");
  return sendSuccess(res, 200, "Task status updated", task);
});

// POST /tasks/:taskId/checklists  { title }
const addChecklistItem = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) throw new ApiError(400, "title is required");

  const task = await Task.findById(req.params.taskId);
  if (!task) throw new ApiError(404, "Task not found");

  task.checklist.push({ title });
  await task.save();

  return sendSuccess(res, 201, "Checklist item added", task.checklist[task.checklist.length - 1]);
});

// PATCH /checklists/:checklistId  { title }
const updateChecklistItem = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ "checklist._id": req.params.checklistId });
  if (!task) throw new ApiError(404, "Checklist item not found");

  const item = task.checklist.id(req.params.checklistId);
  if (req.body.title !== undefined) item.title = req.body.title;
  await task.save();

  return sendSuccess(res, 200, "Checklist item updated", item);
});

// DELETE /checklists/:checklistId
const deleteChecklistItem = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ "checklist._id": req.params.checklistId });
  if (!task) throw new ApiError(404, "Checklist item not found");

  task.checklist.id(req.params.checklistId).deleteOne();
  await task.save();

  return sendSuccess(res, 200, "Checklist item deleted");
});

// PATCH /checklist/:checklistId/complete
const completeChecklistItem = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ "checklist._id": req.params.checklistId });
  if (!task) throw new ApiError(404, "Checklist item not found");

  const item = task.checklist.id(req.params.checklistId);
  item.isCompleted = true;
  item.completedAt = new Date();
  await task.save();

  return sendSuccess(res, 200, "Checklist item completed", item);
});

// POST /tasks/:taskId/evidence  (multipart: file)
const addEvidence = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "file is required");

  const task = await Task.findById(req.params.taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const attachment = await Attachment.create({
    url: `/uploads/evidence/${req.file.filename}`,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user._id,
    task: task._id,
  });

  return sendSuccess(res, 201, "Evidence uploaded", attachment);
});

// DELETE /tasks/:taskId/evidence/:fileId
const deleteEvidence = asyncHandler(async (req, res) => {
  const attachment = await Attachment.findOne({ _id: req.params.fileId, task: req.params.taskId });
  if (!attachment) throw new ApiError(404, "Evidence not found");

  const filePath = path.join(__dirname, "..", attachment.url.replace(/^\/uploads/, "uploads"));
  fs.unlink(filePath, () => {});
  await attachment.deleteOne();

  return sendSuccess(res, 200, "Evidence deleted");
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  updateTaskStatus,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  completeChecklistItem,
  addEvidence,
  deleteEvidence,
};
