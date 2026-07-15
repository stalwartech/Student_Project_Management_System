const express = require("express")
const router = express.Router()

router.post("/coordinator/academic-session")
router.get("/coordinator/academic-session")
router.patch("/coordinator/academic-session/:sessionId")
router.patch("/coordinator/academic-session/:sessionId/activate")
router.patch("/coordinator/academic-session/:sessionId/deactivate")

module.exports = router 