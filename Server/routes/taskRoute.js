const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  updateTaskStatus,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  completeChecklistItem,
  addEvidence,
  deleteEvidence,
  lockTask,
  unlockTask,
  addTaskFeedback,
} = require("../controllers/taskController");
const { protect, authorize } = require("../middleware/auth");
const { uploadEvidence } = require("../middleware/upload");

router.use(protect);

router.post("/tasks", authorize("student"), createTask);
router.get("/tasks", authorize("student", "supervisor", "coordinator"), getTasks);
router.get("/tasks/:taskId", authorize("student", "supervisor", "coordinator"), getTaskById);
router.patch("/tasks/:taskId", authorize("student"), updateTask);
router.delete("/tasks/:taskId", authorize("student"), deleteTask);
router.patch("/tasks/:taskId/complete", authorize("student"), completeTask);
router.patch("/tasks/:taskId/status", authorize("student"), updateTaskStatus);
router.patch("/tasks/:taskId/lock", authorize("supervisor"), lockTask);
router.patch("/tasks/:taskId/unlock", authorize("supervisor"), unlockTask);
router.post("/tasks/:taskId/feedback", authorize("supervisor"), addTaskFeedback);

router.post("/tasks/:taskId/checklists", authorize("student"), addChecklistItem);
router.patch("/checklists/:checklistId", authorize("student"), updateChecklistItem);
router.delete("/checklists/:checklistId", authorize("student"), deleteChecklistItem);
router.patch("/checklist/:checklistId/complete", authorize("student"), completeChecklistItem);

router.post("/tasks/:taskId/evidence", authorize("student"), uploadEvidence.single("file"), addEvidence);
router.delete("/tasks/:taskId/evidence/:fileId", authorize("student"), deleteEvidence);

module.exports = router;
