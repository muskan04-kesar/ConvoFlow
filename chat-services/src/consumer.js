const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "chat-consumer",
  brokers: ["localhost:9092"],
});
const { getIO } = require("./socket");

const { redisClient } = require("./redis");


const consumer = kafka.consumer({ groupId: "chat-group" });


const startConsumer = async () => {
  await consumer.connect();
  console.log("🟢 Kafka Consumer connected");

  await consumer.subscribe({
    topic: "chat-messages",
    fromBeginning: true,
  });

 await consumer.run({
 
  eachMessage: async ({ message }) => {
    const value = message.value.toString();
    const parsedMessage = JSON.parse(value);

    console.log("📥 Message consumed:", parsedMessage);
    const io = getIO();
    io.to(parsedMessage.receiverId).emit(
         "new-message",
         parsedMessage
        );

console.log("⚡ Real-time message sent");


    // 1️⃣ Store chat message
    await redisClient.lPush(
      `chat:${parsedMessage.senderId}:${parsedMessage.receiverId}`,
      value
    );
    

    // 2️⃣ Increment unread count for receiver
    await redisClient.incr(
      `unread:${parsedMessage.receiverId}:${parsedMessage.senderId}`
    );

    console.log("🔴 Unread count incremented");
    

  },
});

}

module.exports = { startConsumer };
