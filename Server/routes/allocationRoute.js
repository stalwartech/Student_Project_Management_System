const express = require("express");
const router = express.Router();

const {
  autoAllocation,
  previewAllocation,
  getAllocationReadiness,
  getManualAllocationOptions,
  assignStudentToSupervisor,
  saveSupervisorAllocations,
} = require("../controllers/allocationController");
const { protect, authorize } = require("../middleware/auth");

router.use("/coordinator", protect, authorize("coordinator"));

router.post("/coordinator/projects/auto-allocation", autoAllocation);
router.post("/coordinator/projects/preview-allocation", previewAllocation);
router.get("/coordinator/projects/allocation-readiness", getAllocationReadiness);
router.get("/coordinator/projects/manual-allocation-options", getManualAllocationOptions);
router.post("/coordinator/projects/assign-student-supervisor", assignStudentToSupervisor);
router.post("/coordinator/projects/save-supervisor-allocations", saveSupervisorAllocations);

module.exports = router;
