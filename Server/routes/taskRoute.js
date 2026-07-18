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
} = require("../controllers/taskController");
const { protect, authorize } = require("../middleware/auth");
const { uploadEvidence } = require("../middleware/upload");

router.use(protect, authorize("student"));

router.post("/tasks", createTask);
router.get("/tasks", getTasks);
router.get("/tasks/:taskId", getTaskById);
router.patch("/tasks/:taskId", updateTask);
router.delete("/tasks/:taskId", deleteTask);
router.patch("/tasks/:taskId/complete", completeTask);
router.patch("/tasks/:taskId/status", updateTaskStatus);

router.post("/tasks/:taskId/checklists", addChecklistItem);
router.patch("/checklists/:checklistId", updateChecklistItem);
router.delete("/checklists/:checklistId", deleteChecklistItem);
router.patch("/checklist/:checklistId/complete", completeChecklistItem);

router.post("/tasks/:taskId/evidence", uploadEvidence.single("file"), addEvidence);
router.delete("/tasks/:taskId/evidence/:fileId", deleteEvidence);

module.exports = router;
