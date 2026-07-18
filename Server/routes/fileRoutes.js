const express = require("express");
const router = express.Router();

const { uploadFile, getFile, downloadFile, deleteFile } = require("../controllers/fileController");
const { protect } = require("../middleware/auth");
const { uploadAttachment } = require("../middleware/upload");

router.use(protect);

router.post("/files/upload", uploadAttachment.single("file"), uploadFile);
router.get("/files/:fileId", getFile);
router.get("/files/:fileId/download", downloadFile);
router.delete("/files/:fileId", deleteFile);

module.exports = router;
