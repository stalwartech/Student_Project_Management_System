const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
  updateProjectLimit,
  updateSupervisorLimit,
  updateStudentLimit,
  updateAutoAllocation,
} = require("../controllers/settingsController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("coordinator"));

router.get("/settings", getSettings);
router.patch("/settings", updateSettings);
router.patch("/settings/project-limit", updateProjectLimit);
router.patch("/settings/supervisor-limit", updateSupervisorLimit);
router.patch("/settings/student-limit", updateStudentLimit);
router.patch("/settings/auto-allocation", updateAutoAllocation);

module.exports = router;
