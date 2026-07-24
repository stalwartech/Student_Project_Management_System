const express = require("express");
const router = express.Router();

const {
  studentAnalytics,
  supervisorAnalytics,
  projectAnalytics,
  departmentAnalytics,
  academicSessionAnalytics,
  dashboardAnalytics,
} = require("../controllers/analyticController");
const { protect, authorize } = require("../middleware/auth");

router.use("/analytics", protect, authorize("coordinator"));

router.get("/analytics/student", studentAnalytics);
router.get("/analytics/supervisor", supervisorAnalytics);
router.get("/analytics/projects", projectAnalytics);
router.get("/analytics/department", departmentAnalytics);
router.get("/analytics/academic-session", academicSessionAnalytics);
router.get("/analytics/dashboard", dashboardAnalytics);

module.exports = router;
