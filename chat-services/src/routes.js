const express = require("express");
const router = express.Router();
const messageService = require("./services/messageService");
const asyncHandler = require("./utils/asyncHandler");

/* =======================
   POST: SEND MESSAGE
======================= */
router.post("/send-message", asyncHandler(async (req, res) => {
  const message = await messageService.sendChatMessage(req.body);
  console.log("✅ API responding success");
  return res.status(200).json({ success: true, messageId: message.messageId });
}));

/* =======================
   GET: FETCH MESSAGES
======================= */
router.get("/messages/:senderId/:receiverId", asyncHandler(async (req, res) => {
  const { senderId, receiverId } = req.params;
  const messages = await messageService.getMessages(senderId, receiverId);
  res.json(messages);
}));

/* =======================
   POST: RESET UNREAD COUNT
======================= */
router.post("/unread/reset", asyncHandler(async (req, res) => {
  const { receiverId, senderId } = req.body;
  const result = await messageService.resetUnreadCount(receiverId, senderId);
  return res.status(200).json(result);
}));

/* =======================
   POST: USER ONLINE
======================= */
router.post("/online", asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const result = await messageService.setUserOnline(userId);
  return res.status(200).json(result);
}));

/* =======================
   POST: USER OFFLINE
======================= */
router.post("/offline", asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const result = await messageService.setUserOffline(userId);
  return res.status(200).json(result);
}));

/* =======================
   GET: ONLINE USERS
======================= */
router.get("/online", asyncHandler(async (req, res) => {
  const users = await messageService.getOnlineUsers();
  return res.status(200).json({ onlineUsers: users });
}));

module.exports = router;

