const ChapterSubmission = require("../models/ChapterSubmission");
const Chapter = require("../models/Chapter");
const Feedback = require("../models/Feedback");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { notify } = require("../utils/notify");
const logActivity = require("../utils/logActivity");
const { uploadToCloudinary } = require("../Config/cloudinary");

const sameId = (left, right) => String(left) === String(right);
const assertChapterSubmissionAccess = async (user, chapter) => {
  const project = await Project.findById(chapter.project);
  if (!project) throw new ApiError(404, "Project not found");
  const isStudent = project.students.some((student) => sameId(student, user._id));
  const isSupervisor = project.supervisor && sameId(project.supervisor, user._id);
  if (user.role !== "coordinator" && !isStudent && !isSupervisor) {
    throw new ApiError(403, "You do not have access to this submission");
  }
  return { project, isStudent, isSupervisor };
};

const assertSubmissionAccess = async (user, submission) => {
  const chapter = await Chapter.findById(submission.chapter);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  return assertChapterSubmissionAccess(user, chapter);
};

// POST /chapter-submissions  (multipart: pdf field "file", body: chapter)
const createSubmission = asyncHandler(async (req, res) => {
  const { chapter: chapterId } = req.body;
  if (!chapterId) throw new ApiError(400, "chapter is required");
  if (!req.file) throw new ApiError(400, "PDF file is required");

  const chapter = await Chapter.findById(chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  const { project, isStudent } = await assertChapterSubmissionAccess(req.user, chapter);
  if (!isStudent) throw new ApiError(403, "You can only submit chapters for your assigned project");
  if (project.isLocked) throw new ApiError(403, "This project is locked for submissions");
  if (chapter.isLocked) throw new ApiError(403, "This chapter is locked for submissions");
  const uploaded = await uploadToCloudinary(req.file, "submissions");

  const submission = await ChapterSubmission.create({
    chapter: chapterId,
    PDFFile: uploaded.secure_url,
    cloudinaryPublicId: uploaded.public_id,
    cloudinaryResourceType: uploaded.resource_type,
    version: 1,
    submittedBy: req.user._id,
    status: "pending",
  });

  chapter.status = "Submitted";
  await chapter.save();

  if (project?.supervisor) {
    await notify({
      recipient: project.supervisor,
      sender: req.user._id,
      title: "Chapter submitted",
      message: `${req.user.name} submitted "${chapter.title}" for review.`,
    });
  }

  await logActivity({
    actor: req.user._id,
    action: "chapter_submitted",
    entityType: "chapter_submission",
    entityId: submission._id,
    project: chapter.project,
  });

  return sendSuccess(res, 201, "Chapter submitted", submission);
});

// POST /chapter-submissions/:submissionId/version  (a revised upload for the same chapter)
const addVersion = asyncHandler(async (req, res) => {
  const previous = await ChapterSubmission.findById(req.params.submissionId);
  if (!previous) throw new ApiError(404, "Submission not found");
  if (!req.file) throw new ApiError(400, "PDF file is required");
  const chapter = await Chapter.findById(previous.chapter);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  const { project, isStudent } = await assertChapterSubmissionAccess(req.user, chapter);
  if (!isStudent || !sameId(previous.submittedBy, req.user._id)) {
    throw new ApiError(403, "You can only submit a new version of your own chapter submission");
  }
  if (project.isLocked || chapter.isLocked) throw new ApiError(403, "This chapter is locked for submissions");
  const uploaded = await uploadToCloudinary(req.file, "submissions");

  const latestVersion = await ChapterSubmission.findOne({ chapter: previous.chapter })
    .sort({ version: -1 })
    .select("version");

  const submission = await ChapterSubmission.create({
    chapter: previous.chapter,
    PDFFile: uploaded.secure_url,
    cloudinaryPublicId: uploaded.public_id,
    cloudinaryResourceType: uploaded.resource_type,
    version: (latestVersion?.version || 0) + 1,
    submittedBy: req.user._id,
    status: "pending",
  });

  await logActivity({
    actor: req.user._id,
    action: "chapter_resubmitted",
    entityType: "chapter_submission",
    entityId: submission._id,
  });

  if (project.supervisor) {
    await notify({
      recipient: project.supervisor,
      sender: req.user._id,
      title: "Chapter resubmitted",
      message: `${req.user.name} submitted version ${submission.version} of "${chapter.title}" for review.`,
    });
  }

  return sendSuccess(res, 201, "New version submitted", submission);
});

// GET /chapter-submissions/:submissionId
const getSubmission = asyncHandler(async (req, res) => {
  const submission = await ChapterSubmission.findById(req.params.submissionId)
    .populate("submittedBy", "name matric")
    .populate("reviewedBy", "name title");
  if (!submission) throw new ApiError(404, "Submission not found");
  await assertSubmissionAccess(req.user, submission);
  return sendSuccess(res, 200, "Submission", submission);
});

// GET /chapter-submissions?chapter=:chapterId
const listSubmissions = asyncHandler(async (req, res) => {
  if (!req.query.chapter) throw new ApiError(400, "chapter is required");
  const chapter = await Chapter.findById(req.query.chapter);
  if (!chapter) throw new ApiError(404, "Chapter not found");
  await assertSubmissionAccess(req.user, { chapter: chapter._id });
  const submissions = await ChapterSubmission.find({ chapter: chapter._id }).sort({ version: -1 });
  return sendSuccess(res, 200, "Submissions", submissions);
});

// GET /chapter-submissions/:submissionId/history  (all versions for the same chapter)
const getSubmissionHistory = asyncHandler(async (req, res) => {
  const submission = await ChapterSubmission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, "Submission not found");
  await assertSubmissionAccess(req.user, submission);

  const history = await ChapterSubmission.find({ chapter: submission.chapter }).sort({ version: 1 });
  return sendSuccess(res, 200, "Submission history", history);
});

// GET /chapter-submissions/:submissionId/download
const downloadSubmission = asyncHandler(async (req, res) => {
  const submission = await ChapterSubmission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, "Submission not found");
  await assertSubmissionAccess(req.user, submission);

  return res.redirect(302, submission.PDFFile);
});

const reviewSubmission = async ({ submissionId, reviewer, status, comment }) => {
  const submission = await ChapterSubmission.findById(submissionId);
  if (!submission) throw new ApiError(404, "Submission not found");

  const { isSupervisor } = await assertSubmissionAccess(reviewer, submission);
  if (!isSupervisor) throw new ApiError(403, "Only the assigned supervisor can review this submission");

  submission.status = status;
  submission.reviewedBy = reviewer._id;
  submission.reviewedAt = new Date();
  submission.reviewComment = comment || undefined;
  await submission.save();

  const chapter = await Chapter.findById(submission.chapter);
  if (chapter) {
    if (status === "approved") chapter.status = "Approved";
    if (status === "revision_requested") {
      chapter.status = "In Progress";
      chapter.isLocked = false; // unlock so the student can resubmit
    }
    if (status === "rejected") chapter.status = "In Progress";
    await chapter.save();
  }

  // Every review creates a permanent feedback record, per spec.
  const feedback = await Feedback.create({
    createdBy: reviewer._id,
    project: chapter?.project,
    chapterSubmission: submission._id,
    comment: comment || `Submission ${status.replace("_", " ")}`,
    status: "open",
    feedbackType: "review",
  });

  await notify({
    recipient: submission.submittedBy,
    sender: reviewer._id,
    title: `Submission ${status.replace("_", " ")}`,
    message: comment || `Your submission was ${status.replace("_", " ")}.`,
  });

  await logActivity({
    actor: reviewer._id,
    action: `submission_${status}`,
    entityType: "chapter_submission",
    entityId: submission._id,
    project: chapter?.project,
  });

  return { submission, feedback };
};

// PATCH /chapter-submissions/:submissionId/approve  { comment }
const approveSubmission = asyncHandler(async (req, res) => {
  const result = await reviewSubmission({
    submissionId: req.params.submissionId,
    reviewer: req.user,
    status: "approved",
    comment: req.body.comment,
  });
  return sendSuccess(res, 200, "Submission approved", result);
});

// PATCH /chapter-submissions/:submissionId/reject  { comment }
const rejectSubmission = asyncHandler(async (req, res) => {
  const result = await reviewSubmission({
    submissionId: req.params.submissionId,
    reviewer: req.user,
    status: "rejected",
    comment: req.body.comment,
  });
  return sendSuccess(res, 200, "Submission rejected", result);
});

// PATCH /chapter-submissions/:submissionId/request-revision  { comment }
const requestRevision = asyncHandler(async (req, res) => {
  if (!req.body.comment) throw new ApiError(400, "comment is required when requesting a revision");
  const result = await reviewSubmission({
    submissionId: req.params.submissionId,
    reviewer: req.user,
    status: "revision_requested",
    comment: req.body.comment,
  });
  return sendSuccess(res, 200, "Revision requested", result);
});

module.exports = {
  createSubmission,
  addVersion,
  getSubmission,
  listSubmissions,
  getSubmissionHistory,
  downloadSubmission,
  approveSubmission,
  rejectSubmission,
  requestRevision,
};
