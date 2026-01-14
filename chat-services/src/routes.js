const express = require("express");
const router = express.Router();
const { sendMessage } = require("./kafka");
const { redisClient } = require("./redis");

/* =======================
   POST: SEND MESSAGE
======================= */
router.post("/send-message", async (req, res) => {
  console.log("➡️ /send-message hit");

  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({
        error: "senderId, receiverId and content are required",
      });
    }

    const message = {
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
    };

    console.log("🟡 Sending to Kafka…");

    await Promise.race([
      sendMessage(message),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Kafka timeout")), 4000)
      ),
    ]);

    console.log("✅ API responding success");
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("🔥 API error:", err.message);
    return res.status(500).json({
      error: "Failed to process message",
      details: err.message,
    });
  }
});

/* =======================
   GET: FETCH MESSAGES
======================= */
router.get("/unread/:receiverId/:senderId", async (req, res) => {
  try {
    const { receiverId, senderId } = req.params;

    const count = await redisClient.get(
      `unread:${receiverId}:${senderId}`
    );

    return res.status(200).json({
      unreadCount: Number(count) || 0,
    });
  } catch (err) {
    console.error("🔥 Unread fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch unread count" });
  }
});
/* =======================
   POST: RESET UNREAD COUNT
======================= */
router.post("/unread/reset", async (req, res) => {
  try {
    const { receiverId, senderId } = req.body;

    if (!receiverId || !senderId) {
      return res.status(400).json({
        error: "receiverId and senderId are required",
      });
    }

    await redisClient.set(
      `unread:${receiverId}:${senderId}`,
      0
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("🔥 Reset unread error:", err);
    return res.status(500).json({
      error: "Failed to reset unread count",
    });
  }
});
/* =======================
   POST: USER ONLINE
======================= */
router.post("/online", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    await redisClient.sAdd("online-users", userId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("🔥 Online error:", err);
    return res.status(500).json({ error: "Failed to mark user online" });
  }
});
/* =======================
   POST: USER OFFLINE
======================= */
router.post("/offline", async (req, res) => {
  try {
    const { userId } = req.body;

    await redisClient.sRem("online-users", userId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("🔥 Offline error:", err);
    return res.status(500).json({ error: "Failed to mark user offline" });
  }
});
/* =======================
   GET: ONLINE USERS
======================= */
router.get("/online", async (req, res) => {
  try {
    const users = await redisClient.sMembers("online-users");

    return res.status(200).json({ onlineUsers: users });
  } catch (err) {
    console.error("🔥 Fetch online users error:", err);
    return res.status(500).json({ error: "Failed to fetch online users" });
  }
});




module.exports = router;
