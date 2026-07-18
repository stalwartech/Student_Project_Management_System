const express = require("express");
const router = express.Router();

const { autoAllocation, previewAllocation } = require("../controllers/allocationController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("coordinator"));

router.post("/coordinator/projects/auto-allocation", autoAllocation);
router.post("/coordinator/projects/preview-allocation", previewAllocation);

module.exports = router;
