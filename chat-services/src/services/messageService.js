const Message = require("../models/message");
const crypto = require("crypto");
const { sendMessage } = require("../kafka");
const { redisClient } = require("../redis");
const ApiError = require("../utils/ApiError");

/**
 * Service to handle message sending through Kafka
 */
const sendChatMessage = async (messageData) => {
    const { messageId, senderId, receiverId, content, timestamp } = messageData;

    if (!senderId || !receiverId || !content) {
        throw new ApiError(400, "senderId, receiverId and content are required");
    }

    const message = {
        messageId: messageId || crypto.randomUUID(),
        senderId,
        receiverId,
        content,
        status: "sent",
        timestamp: timestamp || new Date().toISOString(),
    };

    console.log(`🟡 [Service] Sending message ${message.messageId} to Kafka…`);
    await sendMessage(message);
    return message;
};

/**
 * Service to fetch chat history between two users
 */
const getMessages = async (senderId, receiverId) => {
    if (!senderId || !receiverId) {
        throw new ApiError(400, "senderId and receiverId are required");
    }

    const messages = await Message.find({
        $or: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
        ],
    })
        .sort({ timestamp: 1 })
        .lean();

    return messages;
};

/**
 * Service to reset unread count in Redis
 */
const resetUnreadCount = async (receiverId, senderId) => {
    if (!receiverId || !senderId) {
        throw new ApiError(400, "receiverId and senderId are required");
    }

    await redisClient.set(`unread:${receiverId}:${senderId}`, 0);
    return { success: true };
};

/**
 * Service to manage user online status
 */
const setUserOnline = async (userId) => {
    if (!userId) {
        throw new ApiError(400, "userId is required");
    }
    await redisClient.sAdd("online-users", userId);
    return { success: true };
};

const setUserOffline = async (userId) => {
    if (!userId) {
        throw new ApiError(400, "userId is required");
    }
    await redisClient.sRem("online-users", userId);
    return { success: true };
};

const getOnlineUsers = async () => {
    const users = await redisClient.sMembers("online-users");
    return users;
};

module.exports = {
    sendChatMessage,
    getMessages,
    resetUnreadCount,
    setUserOnline,
    setUserOffline,
    getOnlineUsers,
};
