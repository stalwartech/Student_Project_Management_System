const express = require("express")
const router = express.Router()

router.get("/analytics/student")
router.get("/analytics/supervisor")
router.get("/analytics/projects")
router.get("/analytics/department")
router.get("/analytics/academic-session")
router.get("/analytics/dashboard");

module.exports = router 