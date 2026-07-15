const express = require("express")
const router = express.Router()

router.get("/activities/project/:projectId");
router.get("/activities/student/:studentId")
router.get("/activities/supervisor/:supervisorId");
router.get("/activities/system");

module.exports = router 