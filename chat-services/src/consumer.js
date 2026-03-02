const Message = require("./models/message");
const { kafka } = require("./kafka");
const { getIO } = require("./socket");
const { redisClient } = require("./redis");

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "chat-group",
});

const startConsumer = async () => {
  try {
    await consumer.connect();
    console.log("🟢 Kafka Consumer connected");

    const topic = process.env.KAFKA_TOPIC || "chat-messages";
    await consumer.subscribe({
      topic: topic,
      fromBeginning: false,
    });

    console.log(`✅ Subscribed to topic: ${topic}`);

    await consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log("🔥 Message consumed:", data);

          const savedMessage = await Message.findOneAndUpdate(
            { messageId: data.messageId },
            {
              $setOnInsert: {
                messageId: data.messageId,
                senderId: data.senderId,
                receiverId: data.receiverId,
                content: data.content,
                status: "delivered",
                deliveredAt: new Date(),
                timestamp: data.timestamp || new Date(),
              },
            },
            {
              upsert: true,
              new: true,
            }
          ).lean(); // Use .lean() or .toObject() for plain JS object

          const io = getIO();
          if (io) {
            // Notify both sender and receiver rooms
            io.to(data.senderId).to(data.receiverId).emit("new_message", savedMessage);
          }


          const chatKey = [data.senderId, data.receiverId].sort().join(":");
          await redisClient.lPush(
            `chat:${chatKey}`,
            JSON.stringify(savedMessage)
          );

          await redisClient.incr(
            `unread:${data.receiverId}:${data.senderId}`
          );

          await consumer.commitOffsets([
            {
              topic,
              partition,
              offset: (Number(message.offset) + 1).toString(),
            },
          ]);

          console.log("✅ Offset committed");
        } catch (err) {
          console.error("❌ Message processing failed:", err);
        }
      },
    });

    console.log("🎯 Consumer running");
  } catch (err) {
    console.error("❌ Consumer startup failed:", err);
  }
};

const disconnectConsumer = async () => {
  try {
    await consumer.disconnect();
    console.log("✅ Kafka Consumer disconnected");
  } catch (err) {
    console.error("❌ Error disconnecting consumer:", err.message);
  }
};

module.exports = { startConsumer, disconnectConsumer };

