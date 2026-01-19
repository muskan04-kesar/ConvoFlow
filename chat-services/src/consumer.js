const connectDB = require("./db");
connectDB();

const Message = require("./models/message");

const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "chat-consumer",
  brokers: ["localhost:9092"],
});
const { getIO } = require("./socket");

const { redisClient } = require("./redis");

const consumer = kafka.consumer({ groupId: "chat-group" });

const startConsumer = async () => {
  try {
    await consumer.connect();
    console.log("🟢 Kafka Consumer connected");

    await consumer.subscribe({
      topic: "chat-messages",
      fromBeginning: true,
    });

    console.log("✅ Subscribed to 'chat-messages' topic");

    await consumer.run({
      eachMessage: async ({ message }) => {
        const value = message.value.toString();
        const data = JSON.parse(value);

        console.log("🔥 Message consumed:", data);

        // 🟢 Save to MongoDB
        try {
          const saved = await Message.create({
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            timestamp: data.timestamp || new Date(),
          });

          console.log("💾 Message saved to MongoDB:", saved._id);
        } catch (err) {
          console.error("❌ MongoDB save failed:", err.message);
        }

        // 🔵 Emit real-time event (MATCH frontend name)
        const io = getIO();
        io.to(data.receiverId).emit("new_message", data);

        console.log("⚡ Real-time message sent");

        // 🔴 Redis storage
        await redisClient.lPush(
          `chat:${data.senderId}:${data.receiverId}`,
          value
        );

        await redisClient.incr(
          `unread:${data.receiverId}:${data.senderId}`
        );

        console.log("🔴 Unread count incremented");
      },
    });

    console.log("🎯 Consumer is running and waiting for messages...");
  } catch (error) {
    console.error("❌ Consumer error:", error);
    process.exit(1);
  }
};

// 👇 ACTUALLY CALL THE FUNCTION


module.exports = { startConsumer };