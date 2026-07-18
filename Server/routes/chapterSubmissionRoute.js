const express = require("express");
const router = express.Router();

const {
  createSubmission,
  addVersion,
  getSubmission,
  getSubmissionHistory,
  downloadSubmission,
  approveSubmission,
  rejectSubmission,
  requestRevision,
} = require("../controllers/chapterSubmissionController");
const { protect, authorize } = require("../middleware/auth");
const { uploadSubmission } = require("../middleware/upload");

router.use(protect);

router.post("/chapter-submissions", authorize("student"), uploadSubmission.single("file"), createSubmission);
router.post("/chapter-submissions/:submissionId/version", authorize("student"), uploadSubmission.single("file"), addVersion);
router.get("/chapter-submissions/:submissionId", getSubmission);
router.get("/chapter-submissions/:submissionId/history", getSubmissionHistory);
router.get("/chapter-submissions/:submissionId/download", downloadSubmission);
router.patch("/chapter-submissions/:submissionId/approve", authorize("supervisor"), approveSubmission);
router.patch("/chapter-submissions/:submissionId/reject", authorize("supervisor"), rejectSubmission);
router.patch("/chapter-submissions/:submissionId/request-revision", authorize("supervisor"), requestRevision);

module.exports = router;
