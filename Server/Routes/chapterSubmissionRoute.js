const express = require("express")
const router = express.Router()

router.post("/chapter-submissions")
router.post("/chapter-submissions/:submissionId/version");
router.get("/chapter-submissions/:submissionId")
router.get("/chapter-submissions/:submissionId/history");
router.get("/chapter-submissions/:submissionId/download");
router.patch("/chapter-submissions/:submissionId/approve");
router.patch("/chapter-submissions/:submissionId/reject");
router.patch("/chapter-submissions/:submissionId/request-revision");

module.exports = router