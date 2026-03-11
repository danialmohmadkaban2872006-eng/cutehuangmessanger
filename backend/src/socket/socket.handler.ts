// © Danial Mohmad — All Rights Reserved
import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "../utils/jwt";
import { userService } from "../services/user.service";
import { config } from "../config/env";
import { setIo, onlineUsers } from "./io";
import prisma from "../config/prisma";

export function initSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Share io instance with REST controllers
  setIo(io);

  // JWT auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) return next(new Error("No token provided"));
      const payload = verifyAccessToken(token);
      (socket as { userId?: string }).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as { userId?: string }).userId!;

    // Register in online users map
    onlineUsers.set(userId, socket.id);

    // Mark online in DB
    await userService.setOnline(userId, true).catch(console.error);

    // Find all chats this user belongs to and join their rooms
    const participations = await prisma.chatParticipant.findMany({
      where: { userId },
      include: { chat: { include: { participants: { select: { userId: true } } } } },
    });

    for (const p of participations) {
      socket.join(`chat:${p.chatId}`);
    }

    // Broadcast online status to contacts in those chats
    broadcastPresence(io, participations, userId, true);

    // ── Typing indicator ─────────────────────────────────────────────────
    socket.on("typing", (data: { chatId: string; isTyping: boolean }) => {
      // Emit to everyone in the room EXCEPT the sender
      socket.to(`chat:${data.chatId}`).emit("typing", {
        chatId: data.chatId,
        userId,
        isTyping: data.isTyping,
      });
    });

    // ── Mark messages seen ───────────────────────────────────────────────
    socket.on("message:seen", async (data: { chatId: string }) => {
      try {
        await prisma.chatParticipant.update({
          where: { chatId_userId: { chatId: data.chatId, userId } },
          data: { unreadCount: 0, lastReadAt: new Date() },
        });
        await prisma.message.updateMany({
          where: { chatId: data.chatId, senderId: { not: userId } },
          data: { status: "SEEN" },
        });
        socket.to(`chat:${data.chatId}`).emit("message:status", {
          chatId: data.chatId,
          status: "seen",
          seenBy: userId,
        });
      } catch (err) {
        console.error("[socket:message:seen]", err);
      }
    });

    // ── Join newly created chat room ─────────────────────────────────────
    socket.on("chat:join", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await userService.setOnline(userId, false).catch(console.error);
      broadcastPresence(io, participations, userId, false);
    });
  });

  return io;
}

function broadcastPresence(
  io: SocketServer,
  participations: Array<{ chat: { participants: Array<{ userId: string }> } }>,
  userId: string,
  online: boolean
) {
  const notified = new Set<string>();
  for (const p of participations) {
    for (const cp of p.chat.participants) {
      if (cp.userId === userId || notified.has(cp.userId)) continue;
      notified.add(cp.userId);
      const socketId = onlineUsers.get(cp.userId);
      if (socketId) {
        io.to(socketId).emit("presence", { userId, online });
      }
    }
  }
}
