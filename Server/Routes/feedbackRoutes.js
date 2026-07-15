const express = require("express")
const router = express.Router()

router.post("/feedback");
router.get("/feedback");
router.patch("/feedback/:feedbackId");
router.post("/feedback/:feedbackId/reply");
router.patch("/feedback/:feedbackId/resolve");
router.patch("/feedback/:feedbackId/reopen");
router.get("/feedback/submission/:submissionId");

module.exports = router