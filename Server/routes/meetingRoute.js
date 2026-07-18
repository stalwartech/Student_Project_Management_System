const express = require("express");
const router = express.Router();

const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  completeMeeting,
  joinMeeting,
  markAttendance,
  getAttendance,
} = require("../controllers/meetingController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/meetings", authorize("supervisor"), createMeeting);
router.get("/meetings", getMeetings);
router.get("/meetings/:meetingId", getMeetingById);
router.patch("/meetings/:meetingId", authorize("supervisor"), updateMeeting);
router.patch("/meetings/:meetingId/cancel", authorize("supervisor"), cancelMeeting);
router.patch("/meetings/:meetingId/complete", authorize("supervisor"), completeMeeting);
router.post("/meetings/:meetingId/join", joinMeeting);
router.post("/meetings/:meetingId/attendance", authorize("supervisor"), markAttendance);
// GET attendance was missing entirely in the original routes even though
// "View attendance" is an explicit Supervisor capability in the spec.
router.get("/meetings/:meetingId/attendance", authorize("supervisor", "coordinator"), getAttendance);

module.exports = router;
