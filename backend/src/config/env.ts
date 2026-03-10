// © Danial Mohmad — All Rights Reserved
import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT || "4000"),
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "30d",
  },

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  upload: {
    dir: process.env.UPLOAD_DIR || "uploads",
    maxSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "20"),
  },
};
