// © Danial Mohmad — All Rights Reserved
import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "../utils/jwt";
import { userService } from "../services/user.service";
import { chatService } from "../services/chat.service";
import { config } from "../config/env";
import prisma from "../config/prisma";

// userId → socketId mapping
const onlineUsers = new Map<string, string>();

export function initSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) return next(new Error("No token"));
      const payload = verifyAccessToken(token);
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId as string;
    onlineUsers.set(userId, socket.id);

    // Set user online
    await userService.setOnline(userId, true);

    // Broadcast presence to all chats this user is in
    const participations = await prisma.chatParticipant.findMany({
      where: { userId },
      include: { chat: { include: { participants: true } } },
    });

    // Join all chat rooms
    for (const p of participations) {
      socket.join(`chat:${p.chatId}`);
    }

    // Emit online status to relevant users
    broadcastPresence(io, participations, userId, true);

    // ── Send message ──────────────────────────────────────────────
    socket.on("message:send", async (data: { chatId: string; text: string; replyToId?: string }) => {
      try {
        const message = await chatService.sendMessage(data.chatId, userId, data.text, data.replyToId);
        // Emit to all participants in the chat room
        io.to(`chat:${data.chatId}`).emit("message:new", message);
        // Mark as delivered for online users
        const chatParticipants = await prisma.chatParticipant.findMany({
          where: { chatId: data.chatId, userId: { not: userId } },
        });
        for (const p of chatParticipants) {
          if (onlineUsers.has(p.userId)) {
            await prisma.message.update({ where: { id: message.id }, data: { status: "DELIVERED" } });
            io.to(`chat:${data.chatId}`).emit("message:status", { messageId: message.id, chatId: data.chatId, status: "delivered" });
          }
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── Typing indicator ──────────────────────────────────────────
    socket.on("typing", (data: { chatId: string; isTyping: boolean }) => {
      socket.to(`chat:${data.chatId}`).emit("typing", {
        chatId: data.chatId,
        userId,
        isTyping: data.isTyping,
      });
    });

    // ── Mark seen ─────────────────────────────────────────────────
    socket.on("message:seen", async (data: { chatId: string }) => {
      try {
        await chatService.markSeen(data.chatId, userId);
        socket.to(`chat:${data.chatId}`).emit("message:status", {
          chatId: data.chatId,
          status: "seen",
          seenBy: userId,
        });
      } catch {}
    });

    // ── Disconnect ────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await userService.setOnline(userId, false);
      broadcastPresence(io, participations, userId, false);
    });
  });

  return io;
}

function broadcastPresence(io: SocketServer, participations: any[], userId: string, online: boolean) {
  const notifiedUsers = new Set<string>();
  for (const p of participations) {
    for (const cp of p.chat.participants) {
      if (cp.userId !== userId && !notifiedUsers.has(cp.userId)) {
        notifiedUsers.add(cp.userId);
        const targetSocketId = onlineUsers.get(cp.userId);
        if (targetSocketId) {
          io.to(targetSocketId).emit("presence", { userId, online });
        }
      }
    }
  }
}
