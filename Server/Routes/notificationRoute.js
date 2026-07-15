const express = require("express")
const router = express.Router()

router.get("/notifications");
router.patch("/notifications/:notificationId/read");
router.patch("/notifications/read-all");
router.delete("/notification/notificationId");
router.delete("/notifications");

module.exports = router