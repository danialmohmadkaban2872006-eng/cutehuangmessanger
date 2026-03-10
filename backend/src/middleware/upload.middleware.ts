// © Danial Mohmad — All Rights Reserved
import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config/env";

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = config.upload.dir;
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mp3|ogg|wav|pdf|doc|docx|zip/;
  const ok = allowed.test(file.mimetype) || allowed.test(path.extname(file.originalname).toLowerCase().slice(1));
  if (ok) cb(null, true);
  else cb(new Error("File type not allowed"));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxSizeMb * 1024 * 1024 },
});
