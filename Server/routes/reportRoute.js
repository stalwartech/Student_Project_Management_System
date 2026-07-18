const express = require("express");
const router = express.Router();

const { generateReport } = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/auth");

// GET /reports/:type?format=csv|excel|pdf
// type: students | supervisors | projects | academic-sessions | project-completion | meetings | feedback
router.get("/reports/:type", protect, authorize("coordinator"), generateReport);

module.exports = router;
