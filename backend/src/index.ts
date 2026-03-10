// © Danial Mohmad — All Rights Reserved
// Cute Huang Messenger — Backend Entry Point
import "./config/env"; // Load dotenv first
import http from "http";
import { createApp } from "./app";
import { initSocket } from "./socket/socket.handler";
import prisma from "./config/prisma";
import { config } from "./config/env";

async function main() {
  // Test DB connection
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = initSocket(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`🚀 Cute Huang Messenger API running on port ${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Cors: ${config.corsOrigin}`);
    console.log(`   © Danial Mohmad — All Rights Reserved`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down gracefully...");
    io.close();
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main();
