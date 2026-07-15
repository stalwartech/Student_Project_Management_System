const express = require("express")
const router = express.Router()

router.get("/coordinator/dashboard");
router.get("/coordinator/analytics");

module.exports = router 