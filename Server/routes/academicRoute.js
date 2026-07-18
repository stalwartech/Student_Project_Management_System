const express = require("express");
const router = express.Router();

const {
  createSession,
  getSessions,
  updateSession,
  activateSession,
  deactivateSession,
} = require("../controllers/academicController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("coordinator"));

router.post("/coordinator/academic-session", createSession);
router.get("/coordinator/academic-session", getSessions);
router.patch("/coordinator/academic-session/:sessionId", updateSession);
router.patch("/coordinator/academic-session/:sessionId/activate", activateSession);
router.patch("/coordinator/academic-session/:sessionId/deactivate", deactivateSession);

module.exports = router;
