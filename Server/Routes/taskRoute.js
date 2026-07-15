const express = require("express")
const router = express.Router()

router.post("/tasks")
router.get("/tasks")
router.get("/tasks/:taskId")
router.patch("/tasks/:taskId");
router.delete("/tasks/:taskId");
router.patch("/tasks/:taskId/complete");
router.patch("/tasks/:taskId/status");
router.post("/tasks/:taskId/checklists")
router.patch("/checklists/:checklistId");
router.delete("/checklists/:checklistId");
router.patch("/checklist/:checklistId/complete")
router.post("/tasks/:taskId/evidence");
router.delete("/tasks/:taskId/evidence/:fileId");

module.exports = router