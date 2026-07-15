const express = require("express")
const router = express.Router()

router.get("/coordinator/supervisors");
router.get("/coordinator/supervisors/:supervisorId");
router.patch("/coordinator/supervisors/:supervisorId/activate");
router.patch("/coordinator/supervisors/:supervisorId/deactivate");

module.exports = router