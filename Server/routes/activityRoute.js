const express = require("express");
const router = express.Router();

const {
  getProjectActivities,
  getStudentActivities,
  getSupervisorActivities,
  getSystemActivities,
} = require("../controllers/activityController");
const { protect, authorize } = require("../middleware/auth");

router.get("/activities/project/:projectId", protect, getProjectActivities);
router.get("/activities/student/:studentId", protect, getStudentActivities);
router.get("/activities/supervisor/:supervisorId", protect, getSupervisorActivities);
router.get("/activities/system", protect, authorize("coordinator"), getSystemActivities);

module.exports = router;
