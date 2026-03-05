const Message = require("./models/message");
const { kafka, sendToDLQ } = require("./kafka");
const { getIO } = require("./socket");
const { redisClient } = require("./redis");

const MAX_RETRIES = 3;

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "chat-group",
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

/**
 * Process a single message with business logic
 */
const processMessage = async (data) => {
  // 1. Persist to MongoDB (Idempotent upsert)
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
    { upsert: true, new: true }
  ).lean();

  // 2. Broadcast via Socket.IO
  const io = getIO();
  if (io) {
    io.to(data.senderId).to(data.receiverId).emit("new_message", savedMessage);
  }

  // 3. Update Redis Cache
  const chatKey = [data.senderId, data.receiverId].sort().join(":");
  await redisClient.lPush(`chat:${chatKey}`, JSON.stringify(savedMessage));
  await redisClient.lTrim(`chat:${chatKey}`, 0, 99); // Keep last 100 messages

  // 4. Update Unread Count
  await redisClient.incr(`unread:${data.receiverId}:${data.senderId}`);

  return savedMessage;
};

const startConsumer = async () => {
  try {
    await consumer.connect();
    console.log("🟢 Kafka Consumer connected");

    const topic = process.env.KAFKA_TOPIC || "chat-messages";
    await consumer.subscribe({ topic, fromBeginning: false });

    console.log(`✅ Subscribed to topic: ${topic}`);

    await consumer.run({
      autoCommit: false, // Manual commit for reliability
      eachMessage: async ({ topic, partition, message }) => {
        const messageId = message.key?.toString() || "unknown";
        let retryCount = 0;
        let success = false;
        let data;

        try {
          data = JSON.parse(message.value.toString());
        } catch (parseErr) {
          console.error("❌ Failed to parse message value:", parseErr.message);
          return; // Poison pill, skip
        }

        while (retryCount < MAX_RETRIES && !success) {
          try {
            console.log(`🔥 [Consumer] Processing message ${messageId} (Attempt ${retryCount + 1})`);
            await processMessage(data);
            success = true;
          } catch (err) {
            retryCount++;
            console.error(`⚠️ [Consumer] Attempt ${retryCount} failed for ${messageId}:`, err.message);
            if (retryCount < MAX_RETRIES) {
              await new Promise(res => setTimeout(res, 1000 * retryCount)); // Exponential-ish backoff
            }
          }
        }

        if (!success) {
          console.error(`💀 [Consumer] Message ${messageId} exceeded max retries. Sending to DLQ.`);
          await sendToDLQ(data, new Error(`Max retries (${MAX_RETRIES}) exceeded`));
        }

        // Always commit after processing (either success or DLQ) to move to next message
        await consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (Number(message.offset) + 1).toString(),
          },
        ]);
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


