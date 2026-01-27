const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "test-producer",
    brokers: ["localhost:9092"],
});

const producer = kafka.producer();

const sendTestMessage = async () => {
    await producer.connect();

    await producer.send({
        topic: "chat-messages",
        messages: [
            {
                key: "test",
                value: JSON.stringify({
                    senderId: "muskan",
                    receiverId: "dan",
                    content: "Kafka test message 💥",
                    timestamp: new Date(),
                }),
            },
        ],
    });

    console.log("✅ Test message sent to Kafka");
    await producer.disconnect();
};

sendTestMessage();
