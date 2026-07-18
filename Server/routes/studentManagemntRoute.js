const express = require("express");
const router = express.Router();

const {
  getStudents,
  getStudentById,
  activateStudent,
  deactivateStudent,
} = require("../controllers/studentManagementController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("coordinator"));

router.get("/coordinator/students", getStudents);
router.get("/coordinator/students/:studentId", getStudentById);
router.patch("/coordinator/students/:studentId/activate", activateStudent);
router.patch("/coordinator/students/:studentId/deactivate", deactivateStudent);

// Was missing entirely - meant this router could never be mounted.
module.exports = router;
