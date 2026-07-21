const Notification = require("../models/Notification");

/**
 * notify({ sender, recipient, title, message }) - single recipient
 * notifyMany({ sender, recipients, title, message }) - fan-out to many users
 * Both are fire-and-forget so a notification failure never blocks the
 * underlying action (chapter submitted, feedback posted, etc.).
 */
const notify = async ({ sender = null, recipient, title, message }) => {
  try {
    await Notification.create({ sender, recipient, title, message, isRead: false });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};


const notifyMany = async ({ sender = null, recipients = [], title, message }) => {
  await Promise.all(
    recipients
      .filter(Boolean)
      .map((recipient) => notify({ sender, recipient, title, message }))
  );
};

module.exports = { notify, notifyMany };
