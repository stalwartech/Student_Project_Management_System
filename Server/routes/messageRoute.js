const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getPrivateConversation,
  getProjectConversation,
  markMessageRead,
} = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/messages", sendMessage);
router.get("/messages/private/:userId", getPrivateConversation);
router.get("/messages/project/:projectId", getProjectConversation);
router.patch("/messages/:messageId/read", markMessageRead);

module.exports = router;
