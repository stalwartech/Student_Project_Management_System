const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");

// GET /notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  return sendSuccess(res, 200, "Notifications", notifications);
});

// PATCH /notifications/:notificationId/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found");
  return sendSuccess(res, 200, "Notification marked as read", notification);
});

// PATCH /notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  return sendSuccess(res, 200, "All notifications marked as read");
});

// DELETE /notifications/:notificationId
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.notificationId,
    recipient: req.user._id,
  });
  if (!notification) throw new ApiError(404, "Notification not found");
  return sendSuccess(res, 200, "Notification deleted");
});

// DELETE /notifications
const deleteAllNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ recipient: req.user._id });
  return sendSuccess(res, 200, "All notifications deleted");
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications };
