require("dotenv").config();
const express = require("express");
const http = require("http");

const routes = require("./routes");
const { connectProducer } = require("./kafka");
const { startConsumer } = require("./consumer");
const { connectRedis } = require("./redis");
const { initSocket } = require("./socket");
const cors = require("cors");



const app = express();
app.use(cors({
  origin: "http://localhost:5173",
}));
app.use(express.json());
app.use("/api", routes);



const startServer = async () => {
  // 1️⃣ Create HTTP server FIRST
  const server = http.createServer(app);

  // 2️⃣ Initialize socket.io FIRST
  initSocket(server);

  // 3️⃣ Connect infra
  await connectProducer();
  await connectRedis();

  // 4️⃣ Start consumer AFTER socket exists
  await startConsumer();

  // 5️⃣ Start listening
  server.listen(process.env.PORT, () => {
    console.log(`🚀 Chat service running on port ${process.env.PORT}`);
  });
};

startServer();
