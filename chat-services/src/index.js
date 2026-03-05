require("dotenv").config();
const validateEnv = require("./utils/envValidator");
const logger = require("./utils/logger");

// Validate environment variables before doing anything else
try {
  validateEnv();
  logger.info("✅ Environment variables validated");
} catch (error) {
  logger.error(`❌ ${error.message}`);
  process.exit(1);
}

const express = require("express");
const http = require("http");
const connectDB = require("./db");


const routes = require("./routes");
const healthRoute = require("./health");
const { connectProducer } = require("./kafka");
const { startConsumer } = require("./consumer");
const { connectRedis } = require("./redis");
const { initSocket } = require("./socket");
const errorHandler = require("./middlewares/errorHandler");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Monitoring & Routes
app.use("/health", healthRoute);
app.use("/api", routes);

// Global Error Handler
app.use(errorHandler);


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
    logger.error("❌ Infrastructure connection failed", { error: error.message });
  }

  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    logger.info(`🚀 Chat service running on port ${port}`);
  });
};

startServer();
