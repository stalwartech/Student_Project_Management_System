const express = require("express")
const router = express.Router()

router.post("/meetings");
router.get("/meetings");
router.get("/meetings/:meetingId")
router.patch("/meetings/:meetingId")
router.patch("/meetings/:meetingId/cancel")
router.patch("/meetings/:meetingId/complete")
router.post("/meetings/:meetingId/join")
router.post("/meetings/:meetingId/attendance")

module.exports = router