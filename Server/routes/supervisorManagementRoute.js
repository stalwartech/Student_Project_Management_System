const express = require("express");
const router = express.Router();

const {
  getSupervisors,
  getSupervisorById,
  updateSupervisor,
  getSupervisorWorkloadInfo,
  activateSupervisor,
  deactivateSupervisor,
} = require("../controllers/supervisorManagementController");
const { protect, authorize } = require("../middleware/auth");

router.use("/coordinator", protect, authorize("coordinator"));

router.get("/coordinator/supervisors", getSupervisors);
router.get("/coordinator/supervisors/:supervisorId", getSupervisorById);
// Both of these were missing even though "Edit supervisor information" and
// "View supervisor workload" are explicit Coordinator capabilities in the spec.
router.patch("/coordinator/supervisors/:supervisorId", updateSupervisor);
router.get("/coordinator/supervisors/:supervisorId/workload", getSupervisorWorkloadInfo);
router.patch("/coordinator/supervisors/:supervisorId/activate", activateSupervisor);
router.patch("/coordinator/supervisors/:supervisorId/deactivate", deactivateSupervisor);

module.exports = router;
