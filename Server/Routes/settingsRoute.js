const express = require("express")
const router = express.Router()

router.get("/settings")
router.patch("/settings")
router.patch("/settings/project-limit")
router.patch("/settings/supervisor-limit")
router.patch("/settings/student-limit")
router.patch("/settings/auto-allocation");

module.exports = router 