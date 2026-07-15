const express = require("express")
const router = express.Router()

router.post("/coordinator/projects/auto-allocation")
router.post("/coordinator/projects/preview-allocation")

module.exports = router 