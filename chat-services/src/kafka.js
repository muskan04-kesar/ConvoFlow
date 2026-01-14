const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "chat-service",
  brokers: [process.env.KAFKA_BROKER],
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    console.log(`🔄 Connecting to Kafka broker: ${process.env.KAFKA_BROKER}`);
    await producer.connect();
    console.log("✅ Kafka Producer connected");
  } catch (error) {
    console.error("❌ Failed to connect Kafka Producer:", error.message);
    console.error("Broker:", process.env.KAFKA_BROKER);
    throw error;
  }
};

const sendMessage = async (message) => {
  try {
    console.log(`📤 Attempting to send to topic: ${process.env.KAFKA_TOPIC}`);
    
    const result = await producer.send({
      topic: process.env.KAFKA_TOPIC,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
      timeout: 5000,
      acks: 1
    });
    
    console.log("✅ Message sent successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Kafka send error:", error.message);
    console.error("Full error:", error);
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

module.exports = { connectProducer, sendMessage, disconnectProducer };