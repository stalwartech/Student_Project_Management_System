const Message = require("../models/Message");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { notify } = require("../utils/notify");

// POST /messages  { chatType, project?, recipient?, content?, attachment? }
const sendMessage = asyncHandler(async (req, res) => {
  const { chatType, project, recipient, content, attachment } = req.body;
  if (!chatType) throw new ApiError(400, "chatType is required");

  const message = await Message.create({
    sender: req.user._id,
    chatType,
    project,
    recipient,
    content,
    attachment,
  });

  if (chatType === "Private" && recipient) {
    await notify({ sender: req.user._id, recipient, title: "New message", message: content || "Sent an attachment" });
  } else if (chatType === "Project Group" && project) {
    const proj = await Project.findById(project).select("students supervisor");
    const recipients = [...(proj?.students || []), proj?.supervisor].filter(
      (id) => id && String(id) !== String(req.user._id)
    );
    await Promise.all(
      recipients.map((r) =>
        notify({ sender: req.user._id, recipient: r, title: "New group message", message: content || "Sent an attachment" })
      )
    );
  }

  return sendSuccess(res, 201, "Message sent", message);
});

// GET /messages/private/:userId  - conversation between the current user and userId
const getPrivateConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const messages = await Message.find({
    chatType: "Private",
    $or: [
      { sender: req.user._id, recipient: userId },
      { sender: userId, recipient: req.user._id },
    ],
  }).sort({ createdAt: 1 });

  return sendSuccess(res, 200, "Conversation", messages);
});

// GET /messages/project/:projectId  - group chat history for a project
const getProjectConversation = asyncHandler(async (req, res) => {
  const messages = await Message.find({ chatType: "Project Group", project: req.params.projectId })
    .populate("sender", "name role")
    .sort({ createdAt: 1 });

  return sendSuccess(res, 200, "Project conversation", messages);
});

// PATCH /messages/:messageId/read
const markMessageRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) throw new ApiError(404, "Message not found");

  if (message.chatType === "Private") {
    message.status = "read";
  } else if (!message.readBy.some((id) => String(id) === String(req.user._id))) {
    message.readBy.push(req.user._id);
  }
  await message.save();

  return sendSuccess(res, 200, "Message marked as read", message);
});

module.exports = { sendMessage, getPrivateConversation, getProjectConversation, markMessageRead };
