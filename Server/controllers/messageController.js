const Message = require("../models/Message");
const Project = require("../models/Project");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError, sendSuccess } = require("../utils/apiError");
const { notify } = require("../utils/notify");

const isProjectParticipant = (project, userId) =>
  String(project.supervisor) === String(userId) || project.students.some((studentId) => String(studentId) === String(userId));

const getProjectForParticipant = async (projectId, userId) => {
  const project = await Project.findById(projectId).select("students supervisor");
  if (!project) throw new ApiError(404, "Project not found");
  if (!isProjectParticipant(project, userId)) {
    throw new ApiError(403, "You are not a member of this project group");
  }
  return project;
};

// POST /messages  { chatType, project?, recipient?, content?, attachment? }
const sendMessage = asyncHandler(async (req, res) => {
  const { chatType, project, recipient, content, attachment } = req.body;
  if (!chatType) throw new ApiError(400, "chatType is required");

  let groupProject;
  if (chatType === "Project Group") {
    if (!project) throw new ApiError(400, "project is required for Project Group messages");
    groupProject = await getProjectForParticipant(project, req.user._id);
  }

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
  } else if (chatType === "Project Group") {
    const recipients = [...groupProject.students, groupProject.supervisor].filter(
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
  await getProjectForParticipant(req.params.projectId, req.user._id);
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

// GET /messages/unread-summary - counts are keyed by sender or project so
// the UI can identify exactly which conversation has unread activity.
const getUnreadSummary = asyncHandler(async (req, res) => {
  const privateMessages = await Message.find({
    chatType: "Private",
    recipient: req.user._id,
    status: { $ne: "read" },
  }).select("sender");
  const groupProjectIds = await Project.find({
    $or: [{ supervisor: req.user._id }, { students: req.user._id }],
  }).distinct("_id");
  const groupMessages = await Message.find({
    chatType: "Project Group",
    project: { $in: groupProjectIds },
    sender: { $ne: req.user._id },
    readBy: { $ne: req.user._id },
  }).select("project");

  const privateByUser = privateMessages.reduce((counts, message) => {
    const key = String(message.sender);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const groupByProject = groupMessages.reduce((counts, message) => {
    const key = String(message.project);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  return sendSuccess(res, 200, "Unread message summary", { privateByUser, groupByProject });
});

module.exports = { sendMessage, getPrivateConversation, getProjectConversation, markMessageRead, getUnreadSummary };
