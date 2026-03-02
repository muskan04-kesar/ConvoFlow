const { redisClient } = require("./redis");
let io;

const initSocket = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("join", async (userId) => {
      socket.join(userId);
      socket.userId = userId; // Store on socket object
      console.log(`👤 User ${userId} joined room`);

      // Mark online in Redis
      if (redisClient) {
        await redisClient.sAdd("online-users", userId);
        const onlineUsers = await redisClient.sMembers("online-users");
        io.emit("user_status", onlineUsers);
      }
    });

    socket.on("disconnect", async () => {
      console.log("❌ User disconnected:", socket.id);
      if (socket.userId && redisClient) {
        await redisClient.sRem("online-users", socket.userId);
        const onlineUsers = await redisClient.sMembers("online-users");
        io.emit("user_status", onlineUsers);
      }
    });

    socket.on("typing", ({ senderId, receiverId }) => {
      // Send as object to be consistent
      socket.to(receiverId).emit("typing", { senderId });
    });

    socket.on("stop_typing", ({ senderId, receiverId }) => {
      socket.to(receiverId).emit("stop_typing", { senderId });
    });

  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = { initSocket, getIO };
