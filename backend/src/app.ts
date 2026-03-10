// © Danial Mohmad — All Rights Reserved
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { config } from "./config/env";
import authRoutes from "./routes/auth.routes";
import chatRoutes from "./routes/chat.routes";
import userRoutes from "./routes/user.routes";

export function createApp() {
  const app = express();

  // Security
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  // Logging
  if (config.isDev) app.use(morgan("dev"));

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Static uploads
  app.use("/uploads", express.static(path.resolve(config.upload.dir)));

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/chats", chatRoutes);
  app.use("/api/users", userRoutes);

  // Health check
  app.get("/health", (_req, res) => res.json({ status: "ok", service: "Cute Huang Messenger API" }));

  // 404
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[GlobalError]", err);
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  });

  return app;
}
