const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        messageId: {
            type: String,
            unique: true, // ⭐ this prevents duplicates
        },

        senderId: {
            type: String,
            required: true,
        },
        receiverId: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent",
        },
        deliveredAt: Date,
        readAt: Date,

    },
    {
        versionKey: false,
    }
);

module.exports = mongoose.model("Message", messageSchema);
