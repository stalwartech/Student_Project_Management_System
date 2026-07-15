const express = require("express")
const router = express.Router()

router.post("/messages");
router.get("/messages/conversation/:projectId");
router.patch("/messages/:messageId");
router.delete("/messages/:messageId");
router.post("/messages/:messageId/attachment")
router.patch("/messages/:messageId/read")
router.patch("/messages/read-all")

module.exports = router 