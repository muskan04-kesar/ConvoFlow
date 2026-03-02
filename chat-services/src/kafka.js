const { Kafka } = require("kafkajs");
const crypto = require("crypto");

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "chat-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

const producer = kafka.producer();

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

const sendMessage = async (message) => {
  try {
    const payload = {
      ...message,
      messageId: message.messageId || crypto.randomUUID(),
    };

    const topic = process.env.KAFKA_TOPIC || "chat-messages";
    console.log(`📤 Attempting to send to topic: ${topic}`);

    const result = await producer.send({
      topic: topic,
      messages: [
        {
          key: `${payload.senderId}:${payload.receiverId}`,
          value: JSON.stringify(payload),
        },
      ],
      timeout: 5000,
      acks: -1,
    });

    console.log("✅ Message sent successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Kafka send error:", error);
    throw error;
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

module.exports = { kafka, connectProducer, sendMessage, disconnectProducer };
