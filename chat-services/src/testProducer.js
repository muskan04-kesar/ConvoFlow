require("dotenv").config();
const { sendMessage, connectProducer, disconnectProducer } = require("./kafka");

const sendTestMessage = async () => {
    try {
        await connectProducer();

        await sendMessage({
            senderId: "muskan",
            receiverId: "dan",
            content: "Kafka test message 💥",
            timestamp: new Date(),
        });

        console.log("✅ Test message sent to Kafka");
    } catch (err) {
        console.error("❌ Test message failed:", err);
    } finally {
        await disconnectProducer();
    }
};

sendTestMessage();

