const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/notifications", getNotifications);
router.patch("/notifications/:notificationId/read", markAsRead);
router.patch("/notifications/read-all", markAllAsRead);
// Was "/notification/notificationId" - missing the ":" param prefix (so it
// matched a literal string, not a param) and inconsistent singular path.
router.delete("/notifications/:notificationId", deleteNotification);
router.delete("/notifications", deleteAllNotifications);

module.exports = router;
