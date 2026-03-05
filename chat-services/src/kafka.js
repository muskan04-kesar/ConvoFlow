const { Kafka, logLevel } = require("kafkajs");
const crypto = require("crypto");

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "chat-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  connectionTimeout: 10000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 100,
    retries: 8,
    multiplier: 2,
    maxRetryTime: 30000,
  },
  logLevel: logLevel.ERROR,
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
});

const connectProducer = async () => {
  try {
    const broker = process.env.KAFKA_BROKER || "localhost:9092";
    console.log(`🔄 Connecting to Kafka broker: ${broker}`);
    await producer.connect();
    console.log("✅ Kafka Producer connected");
  } catch (error) {
    console.error("❌ Failed to connect Kafka Producer:", error.message);
    throw error;
  }
};

const sendMessage = async (message, topic = process.env.KAFKA_TOPIC || "chat-messages") => {
  try {
    const payload = {
      ...message,
      messageId: message.messageId || crypto.randomUUID(),
    };

    console.log(`📤 [Producer] Sending message to topic: ${topic}`);

    const result = await producer.send({
      topic: topic,
      messages: [
        {
          key: `${payload.senderId}:${payload.receiverId}`,
          value: JSON.stringify(payload),
          headers: {
            "retry-count": "0",
            "original-topic": topic,
          },
        },
      ],
      acks: -1, // Wait for all replicas
    });

    console.log("✅ [Producer] Message sent successfully");
    return result;
  } catch (error) {
    console.error("❌ [Producer] Kafka send error:", error);
    throw error;
  }
};

/**
 * Utility to send failed messages to Dead Letter Queue
 */
const sendToDLQ = async (message, error) => {
  const dlqTopic = `${process.env.KAFKA_TOPIC || "chat-messages"}-dlq`;
  try {
    console.warn(`🚨 [DLQ] Sending message ${message.messageId} to DLQ: ${dlqTopic}`);
    await producer.send({
      topic: dlqTopic,
      messages: [
        {
          key: message.messageId,
          value: JSON.stringify({
            originalMessage: message,
            error: error.message,
            failedAt: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (dlqErr) {
    console.error("💀 [DLQ] Failed to send to DLQ topic:", dlqErr);
  }
};

const disconnectProducer = async () => {
  try {
    await producer.disconnect();
    console.log("✅ Kafka Producer disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting producer:", error.message);
  }
};

module.exports = { kafka, connectProducer, sendMessage, sendToDLQ, disconnectProducer };

