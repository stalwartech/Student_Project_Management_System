const express = require("express")
const router = express.Router()


// Coordinator Project management 
router.post("/coordinator/projects")
router.get("/coordinator/projects")
router.patch("/coordinator/projects/:projectID")
router.delete("/coordinator/projects/:projectID")

// The main project itself
router.get("/projects/my-project")
router.get("/projects/:projectId")
router.get("/projects/:projectId/members")
router.get("/projects/:projectId/supervisors");
router.get("/projects/:projectId/timeline")
router.get("/projects/:projectId/analytics")
router.get("/projects/assigned");
router.patch("/projects/:projectId/lock")
router.patch("/projects/:projectId/unlock");
router.get("/projects")
router.get("/projects/search")
router.get("/project/filter");

module.exports = router
