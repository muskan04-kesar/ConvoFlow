const connectDB = require("./db");
connectDB();

const Message = require("./models/message");
const { Kafka } = require("kafkajs");
const { getIO } = require("./socket");
const { redisClient } = require("./redis");

const kafka = new Kafka({
  clientId: "chat-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "chat-group-debug-1",
});

const startConsumer = async () => {
  try {
    await consumer.connect();
    console.log("🟢 Kafka Consumer connected");

    await consumer.subscribe({
      topic: "chat-messages",
      fromBeginning: false,
    });

    console.log("✅ Subscribed to chat-messages");

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
              new: true, // ⭐ IMPORTANT
            }
          );

          const io = getIO();
          io.to(data.receiverId).emit("new_message", savedMessage);

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

module.exports = { startConsumer };
startConsumer();
