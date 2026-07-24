const express = require("express");
const router = express.Router();

const {
  createChapter,
  getChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  lockChapter,
  unlockChapter,
  completeChapter,
} = require("../controllers/chapterController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/chapters", authorize("student"), createChapter);
router.get("/chapters", getChapters);
router.get("/chapters/:chapterId", getChapterById);
router.patch("/chapters/:chapterId", authorize("student"), updateChapter);
router.delete("/chapters/:chapterId", authorize("student"), deleteChapter);
router.patch("/chapters/:chapterId/lock", authorize("supervisor"), lockChapter);
router.patch("/chapters/:chapterId/unlock", authorize("supervisor"), unlockChapter);
router.patch("/chapters/:chapterId/complete", authorize("supervisor"), completeChapter);

module.exports = router;
