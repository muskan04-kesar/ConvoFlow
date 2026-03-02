require("dotenv").config();
const express = require("express");
const http = require("http");
const connectDB = require("./db");


const routes = require("./routes");
const { connectProducer } = require("./kafka");
const { startConsumer } = require("./consumer");
const { connectRedis } = require("./redis");
const { initSocket } = require("./socket");
const cors = require("cors");



const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use("/api", routes);

const startServer = async () => {
  const server = http.createServer(app);

  // Initialize socket.io
  initSocket(server);

  // Connect database
  connectDB();

  // Connect infrastructure
  try {
    await connectProducer();
    await connectRedis();
    await startConsumer(); // Start Kafka consumer
  } catch (error) {
    console.error("❌ Infrastructure connection failed:", error);
  }

  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`🚀 Chat service running on port ${port}`);
  });
};

startServer();

