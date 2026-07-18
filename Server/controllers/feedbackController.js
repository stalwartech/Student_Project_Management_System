const Feedback = require("../models/Feedback");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { notify } = require("../utils/notify");

// POST /feedback
const createFeedback = asyncHandler(async (req, res) => {
  const { project, chapterSubmission, comment, priority, feedbackType, recipient } = req.body;
  if (!project || !chapterSubmission || !comment) {
    throw new ApiError(400, "project, chapterSubmission and comment are required");
  }

  const feedback = await Feedback.create({
    project,
    chapterSubmission,
    comment,
    priority,
    feedbackType,
    createdBy: req.user._id,
  });

  if (recipient) {
    await notify({ sender: req.user._id, recipient, title: "New feedback", message: comment });
  }

  return sendSuccess(res, 201, "Feedback created", feedback);
});

// GET /feedback?project=&status=
const getFeedback = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.project) query.project = req.query.project;
  if (req.query.status) query.status = req.query.status;

  const feedback = await Feedback.find(query).populate("createdBy", "name role").sort({ createdAt: -1 });
  return sendSuccess(res, 200, "Feedback", feedback);
});

// PATCH /feedback/:feedbackId
const updateFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(req.params.feedbackId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!feedback) throw new ApiError(404, "Feedback not found");
  return sendSuccess(res, 200, "Feedback updated", feedback);
});

// POST /feedback/:feedbackId/reply  { response }
const replyToFeedback = asyncHandler(async (req, res) => {
  const { response } = req.body;
  if (!response) throw new ApiError(400, "response is required");

  const feedback = await Feedback.findById(req.params.feedbackId);
  if (!feedback) throw new ApiError(404, "Feedback not found");

  feedback.response = response;
  feedback.responseAt = new Date();
  await feedback.save();

  await notify({ sender: req.user._id, recipient: feedback.createdBy, title: "Feedback response", message: response });

  return sendSuccess(res, 200, "Reply added", feedback);
});

// PATCH /feedback/:feedbackId/resolve
const resolveFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(req.params.feedbackId, { status: "resolved" }, { new: true });
  if (!feedback) throw new ApiError(404, "Feedback not found");
  return sendSuccess(res, 200, "Feedback resolved", feedback);
});

// PATCH /feedback/:feedbackId/reopen
const reopenFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(req.params.feedbackId, { status: "reopened" }, { new: true });
  if (!feedback) throw new ApiError(404, "Feedback not found");
  return sendSuccess(res, 200, "Feedback reopened", feedback);
});

// GET /feedback/submission/:submissionId
const getFeedbackBySubmission = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ chapterSubmission: req.params.submissionId }).sort({ createdAt: 1 });
  return sendSuccess(res, 200, "Feedback for submission", feedback);
});

module.exports = {
  createFeedback,
  getFeedback,
  updateFeedback,
  replyToFeedback,
  resolveFeedback,
  reopenFeedback,
  getFeedbackBySubmission,
};
