// © Danial Mohmad — All Rights Reserved
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { chatService } from "../services/chat.service";
import { MediaType } from "@prisma/client";
import path from "path";

function getMediaType(filename: string): MediaType {
  const ext = path.extname(filename).toLowerCase();
  if ([".jpg",".jpeg",".png",".gif",".webp"].includes(ext)) return MediaType.IMAGE;
  if ([".mp4",".webm",".mov"].includes(ext)) return MediaType.VIDEO;
  if ([".mp3",".ogg",".wav",".m4a"].includes(ext)) return MediaType.AUDIO;
  return MediaType.FILE;
}

export const chatController = {
  async getChats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const chats = await chatService.getChats(req.user!.id);
      res.json(chats);
    } catch (err) {
      console.error("[getChats]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async createChat(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { participantId } = req.body;
      if (!participantId) { res.status(400).json({ error: "participantId required" }); return; }
      const chat = await chatService.getOrCreateDirectChat(req.user!.id, participantId);
      res.status(201).json(chat);
    } catch (err: any) {
      if (err.code === "FORBIDDEN") { res.status(403).json({ error: err.message }); return; }
      console.error("[createChat]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const { cursor } = req.query as { cursor?: string };
      const messages = await chatService.getMessages(chatId, req.user!.id, cursor);
      res.json(messages);
    } catch (err: any) {
      if (err.code === "FORBIDDEN") { res.status(403).json({ error: err.message }); return; }
      console.error("[getMessages]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const { text, replyToId } = req.body;
      if (!text?.trim()) { res.status(400).json({ error: "text required" }); return; }
      const message = await chatService.sendMessage(chatId, req.user!.id, text.trim(), replyToId);
      res.status(201).json(message);
    } catch (err: any) {
      if (err.code === "FORBIDDEN") { res.status(403).json({ error: err.message }); return; }
      console.error("[sendMessage]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async sendMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const file = req.file;
      if (!file) { res.status(400).json({ error: "No file uploaded" }); return; }
      const mediaUrl = `/uploads/${file.filename}`;
      const mediaType = getMediaType(file.filename);
      const message = await chatService.sendMediaMessage(chatId, req.user!.id, mediaUrl, mediaType);
      res.status(201).json(message);
    } catch (err: any) {
      if (err.code === "FORBIDDEN") { res.status(403).json({ error: err.message }); return; }
      console.error("[sendMedia]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async markSeen(req: AuthRequest, res: Response): Promise<void> {
    try {
      await chatService.markSeen(req.params.chatId, req.user!.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("[markSeen]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async deleteMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      await chatService.deleteMessage(req.params.messageId, req.user!.id);
      res.json({ ok: true });
    } catch (err: any) {
      if (err.code === "FORBIDDEN") { res.status(403).json({ error: err.message }); return; }
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
