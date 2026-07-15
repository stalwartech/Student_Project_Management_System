const express = require("express")
const router = express.Router()

router.post("/chapters");
router.get("/chapters");
router.get("/chapters/:chapterId")
router.patch("/chapters/:chapterId")
router.delete("/chapters/:chapterId")
router.patch("/chapters/:chapterId/lock")
router.patch("/chapters/:chapterId/unlock")
router.patch("/chapters/:chapterId/complete")

module.exports = router
