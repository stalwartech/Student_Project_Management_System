const express = require("express");
const router = express.Router();

const {
  assignSupervisor,
  changeSupervisor,
  assignStudent,
  removeStudent,
} = require("../controllers/assignmentController");
const { protect, authorize } = require("../middleware/auth");

router.use("/coordinator", protect, authorize("coordinator"));

router.post("/coordinator/projects/:projectID/assign-supervisor", assignSupervisor);
router.patch("/coordinator/projects/:projectID/change-supervisor", changeSupervisor);
router.post("/coordinator/projects/:projectID/assign-student", assignStudent);
router.delete("/coordinator/projects/:projectID/remove-student/:studentID", removeStudent);

module.exports = router;
