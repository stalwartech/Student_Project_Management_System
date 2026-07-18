const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  getMyProject,
  getAssignedProjects,
  getProjectById,
  getProjectMembers,
  getProjectSupervisor,
  getProjectTimeline,
  getProjectAnalytics,
  lockProject,
  unlockProject,
} = require("../controllers/projectController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// Coordinator project management
router.post("/coordinator/projects", authorize("coordinator"), createProject);
router.get("/coordinator/projects", authorize("coordinator"), getProjects);
router.patch("/coordinator/projects/:projectID", authorize("coordinator"), updateProject);
router.delete("/coordinator/projects/:projectID", authorize("coordinator"), deleteProject);

// Fixed-value / role-scoped routes must come before the generic "/:projectId"
// route below, or Express would try to match "my-project"/"search"/"assigned" as an id.
router.get("/projects/my-project", authorize("student"), getMyProject);
router.get("/projects/assigned", authorize("supervisor"), getAssignedProjects);
router.get("/projects/search", getProjects);
// Was singular "/project/filter" (inconsistent with every other route here) - fixed to plural.
router.get("/projects/filter", getProjects);
router.get("/projects", getProjects);

router.get("/projects/:projectId", getProjectById);
router.get("/projects/:projectId/members", getProjectMembers);
router.get("/projects/:projectId/supervisors", getProjectSupervisor);
router.get("/projects/:projectId/timeline", getProjectTimeline);
router.get("/projects/:projectId/analytics", getProjectAnalytics);
router.patch("/projects/:projectId/lock", authorize("supervisor"), lockProject);
router.patch("/projects/:projectId/unlock", authorize("supervisor"), unlockProject);

module.exports = router;
