const express = require("express")
const router = express.Router()

router.post("/files/upload")
router.get("/files/:fileId")
router.get("/files/:fileId/download");
router.delete("/files/:fileId")

module.exports = router 