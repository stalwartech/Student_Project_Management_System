const express = require("express");
const router = express.Router();

const { getDashboard, getDashboardAnalytics } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("coordinator"));

router.get("/coordinator/dashboard", getDashboard);
router.get("/coordinator/analytics", getDashboardAnalytics);

module.exports = router;
