const express = require("express")
const router = express.Router()

router.post("/coordinator/projects/:projectID/assign-supervisor")
router.patch("/coordinator/projects/:projectID/change-supervisor")
router.post("/coordinator/projects/:projectID/assign-student")
router.delete("/coordinator/projects/:projectID/remove-student/:studentID");

module.exports = router