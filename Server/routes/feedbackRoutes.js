const express = require("express");
const router = express.Router();

const {
  createFeedback,
  getFeedback,
  updateFeedback,
  replyToFeedback,
  resolveFeedback,
  reopenFeedback,
  getFeedbackBySubmission,
} = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/feedback", authorize("supervisor"), createFeedback);
router.get("/feedback", getFeedback);
router.patch("/feedback/:feedbackId", authorize("supervisor"), updateFeedback);
router.post("/feedback/:feedbackId/reply", authorize("student"), replyToFeedback);
router.patch("/feedback/:feedbackId/resolve", resolveFeedback);
router.patch("/feedback/:feedbackId/reopen", reopenFeedback);
router.get("/feedback/submission/:submissionId", getFeedbackBySubmission);

module.exports = router;
