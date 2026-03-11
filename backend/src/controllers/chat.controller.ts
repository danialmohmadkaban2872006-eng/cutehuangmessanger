// © Danial Mohmad — All Rights Reserved
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { chatService } from "../services/chat.service";
import { MediaType } from "@prisma/client";
import { getIo, onlineUsers } from "../socket/io";
import path from "path";

function getMediaType(filename: string): MediaType {
  const ext = path.extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) return MediaType.IMAGE;
  if ([".mp4", ".webm", ".mov"].includes(ext)) return MediaType.VIDEO;
  if ([".mp3", ".ogg", ".wav", ".m4a"].includes(ext)) return MediaType.AUDIO;
  return MediaType.FILE;
}

/** Emit message:new to all room participants EXCEPT the sender. */
function emitNewMessage(chatId: string, senderId: string, message: unknown) {
  const io = getIo();
  if (!io) return;
  const senderSocketId = onlineUsers.get(senderId);
  if (senderSocketId) {
    // Exclude sender — they already have the message from optimistic + REST response
    io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
  } else {
    // Sender is offline (no socket) — safe to broadcast to all in room
    io.to(`chat:${chatId}`).emit("message:new", message);
  }
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
      if (!participantId) {
        res.status(400).json({ error: "participantId is required" });
        return;
      }
      if (participantId === req.user!.id) {
        res.status(400).json({ error: "Cannot create a chat with yourself" });
        return;
      }
      const chat = await chatService.getOrCreateDirectChat(req.user!.id, participantId);
      // Tell the other user's socket to join the new chat room
      const io = getIo();
      if (io) {
        const otherSocketId = onlineUsers.get(participantId);
        if (otherSocketId) {
          io.to(otherSocketId).emit("chat:join", chat.id);
        }
      }
      res.status(201).json(chat);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "FORBIDDEN") { res.status(403).json({ error: "Forbidden" }); return; }
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
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "FORBIDDEN") { res.status(403).json({ error: "Forbidden" }); return; }
      console.error("[getMessages]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const { text, replyToId } = req.body as { text?: string; replyToId?: string };
      if (!text?.trim()) {
        res.status(400).json({ error: "text is required" });
        return;
      }
      const message = await chatService.sendMessage(chatId, req.user!.id, text.trim(), replyToId);

      // Push to all OTHER participants via socket — sender uses REST response + optimistic replacement
      emitNewMessage(chatId, req.user!.id, message);

      res.status(201).json(message);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "FORBIDDEN") { res.status(403).json({ error: "Forbidden" }); return; }
      console.error("[sendMessage]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  async sendMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }
      const mediaUrl = `/uploads/${file.filename}`;
      const mediaType = getMediaType(file.filename);
      const message = await chatService.sendMediaMessage(
        chatId, req.user!.id, mediaUrl, mediaType
      );

      // Broadcast to ALL participants — sender already added it via sendMedia in context
      const io = getIo();
      const senderSocketId = onlineUsers.get(req.user!.id);
      if (io) {
        if (senderSocketId) {
          io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
        } else {
          io.to(`chat:${chatId}`).emit("message:new", message);
        }
      }

      res.status(201).json(message);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "FORBIDDEN") { res.status(403).json({ error: "Forbidden" }); return; }
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
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "FORBIDDEN") { res.status(403).json({ error: "Forbidden" }); return; }
      console.error("[deleteMessage]", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
