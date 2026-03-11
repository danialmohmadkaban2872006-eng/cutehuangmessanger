// © Danial Mohmad — All Rights Reserved
import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "../utils/jwt";
import { userService } from "../services/user.service";
<<<<<<< HEAD
import { config } from "../config/env";
import { setIo, onlineUsers } from "./io";
import prisma from "../config/prisma";

=======
import { chatService } from "../services/chat.service";
import { config } from "../config/env";
import prisma from "../config/prisma";

// userId → socketId mapping
const onlineUsers = new Map<string, string>();

>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
export function initSocket(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

<<<<<<< HEAD
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
=======
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
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    }
  });

  io.on("connection", async (socket) => {
<<<<<<< HEAD
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

=======
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
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    for (const p of participations) {
      socket.join(`chat:${p.chatId}`);
    }

<<<<<<< HEAD
    // Broadcast online status to contacts in those chats
    broadcastPresence(io, participations, userId, true);

    // ── Typing indicator ─────────────────────────────────────────────────
    socket.on("typing", (data: { chatId: string; isTyping: boolean }) => {
      // Emit to everyone in the room EXCEPT the sender
=======
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
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
      socket.to(`chat:${data.chatId}`).emit("typing", {
        chatId: data.chatId,
        userId,
        isTyping: data.isTyping,
      });
    });

<<<<<<< HEAD
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
=======
    // ── Mark seen ─────────────────────────────────────────────────
    socket.on("message:seen", async (data: { chatId: string }) => {
      try {
        await chatService.markSeen(data.chatId, userId);
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
        socket.to(`chat:${data.chatId}`).emit("message:status", {
          chatId: data.chatId,
          status: "seen",
          seenBy: userId,
        });
<<<<<<< HEAD
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
=======
      } catch {}
    });

    // ── Disconnect ────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await userService.setOnline(userId, false);
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
      broadcastPresence(io, participations, userId, false);
    });
  });

  return io;
}

<<<<<<< HEAD
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
=======
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
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
      }
    }
  }
}
