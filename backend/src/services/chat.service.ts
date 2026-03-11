// © Danial Mohmad — All Rights Reserved
import prisma from "../config/prisma";
import { MessageStatus, MediaType } from "@prisma/client";

<<<<<<< HEAD
const USER_SELECT = {
  id: true, appId: true, displayName: true, avatar: true,
  bio: true, online: true, email: true, createdAt: true, updatedAt: true,
};

// ─────────────────────────────────────────────────────────────────────────────

export const chatService = {

=======
const USER_SELECT = { id: true, appId: true, displayName: true, avatar: true, bio: true, online: true, email: true, createdAt: true, updatedAt: true };

export const chatService = {
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
  async getChats(userId: string) {
    const participations = await prisma.chatParticipant.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            participants: { include: { user: { select: USER_SELECT } } },
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: { select: USER_SELECT } },
            },
          },
        },
      },
      orderBy: { chat: { updatedAt: "desc" } },
    });

    return participations.map(p => ({
      id: p.chat.id,
      participants: p.chat.participants.map(cp => cp.user),
      lastMessage: p.chat.messages[0] ? formatMessage(p.chat.messages[0]) : null,
      unreadCount: p.unreadCount,
      createdAt: p.chat.createdAt,
      updatedAt: p.chat.updatedAt,
    }));
  },

<<<<<<< HEAD
  /**
   * FIX: replaced the broken `every` Prisma filter.
   * Strategy: find chats where the current user is a participant,
   * then check if the target participant is also in those same chats.
   */
  async getOrCreateDirectChat(userId: string, participantId: string) {
    // Step 1: get all chatIds where userId is a participant
    const userParticipations = await prisma.chatParticipant.findMany({
      where: { userId },
      select: { chatId: true },
    });
    const candidateChatIds = userParticipations.map(p => p.chatId);

    // Step 2: among those, find one where participantId is ALSO a participant and type is DIRECT
    const existing = candidateChatIds.length > 0
      ? await prisma.chat.findFirst({
          where: {
            id: { in: candidateChatIds },
            type: "DIRECT",
            participants: { some: { userId: participantId } },
          },
          include: {
            participants: { include: { user: { select: USER_SELECT } } },
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: { select: USER_SELECT } },
            },
          },
        })
      : null;

    if (existing) {
      const myParticipation = await prisma.chatParticipant.findUnique({
        where: { chatId_userId: { chatId: existing.id, userId } },
        select: { unreadCount: true },
      });
=======
  async getOrCreateDirectChat(userId: string, participantId: string) {
    // Check if chat already exists
    const existing = await prisma.chat.findFirst({
      where: {
        type: "DIRECT",
        participants: {
          every: { userId: { in: [userId, participantId] } },
        },
      },
      include: {
        participants: {
          include: { user: { select: USER_SELECT } },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (existing && existing.participants.length === 2) {
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
      return {
        id: existing.id,
        participants: existing.participants.map(cp => cp.user),
        lastMessage: existing.messages[0] ? formatMessage(existing.messages[0]) : null,
<<<<<<< HEAD
        unreadCount: myParticipation?.unreadCount ?? 0,
=======
        unreadCount: 0,
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };
    }

<<<<<<< HEAD
    // Step 3: no existing chat — create one
=======
    // Create new direct chat
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    const chat = await prisma.chat.create({
      data: {
        type: "DIRECT",
        participants: {
          create: [{ userId }, { userId: participantId }],
        },
      },
      include: {
        participants: { include: { user: { select: USER_SELECT } } },
      },
    });

    return {
      id: chat.id,
      participants: chat.participants.map(cp => cp.user),
      lastMessage: null,
      unreadCount: 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  },

  async getMessages(chatId: string, userId: string, cursor?: string) {
<<<<<<< HEAD
    // Verify the user is a participant
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
=======
    // Verify user is participant
    const participant = await prisma.chatParticipant.findUnique({ where: { chatId_userId: { chatId, userId } } });
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    if (!participant) throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: { select: USER_SELECT },
<<<<<<< HEAD
        replyTo: {
          select: { id: true, text: true, senderId: true, createdAt: true },
        },
=======
        replyTo: { include: { sender: { select: USER_SELECT } } },
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return messages.map(formatMessage);
  },

<<<<<<< HEAD
  async sendMessage(
    chatId: string,
    senderId: string,
    text: string,
    replyToId?: string
  ) {
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: senderId } },
    });
    if (!participant) throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        text,
        replyToId: replyToId || null,
        status: MessageStatus.SENT,
      },
      include: {
        sender: { select: USER_SELECT },
        replyTo: {
          select: { id: true, text: true, senderId: true, createdAt: true },
        },
      },
    });

    // Update chat timestamp and increment unread for others
=======
  async sendMessage(chatId: string, senderId: string, text: string, replyToId?: string) {
    const participant = await prisma.chatParticipant.findUnique({ where: { chatId_userId: { chatId, userId: senderId } } });
    if (!participant) throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });

    const message = await prisma.message.create({
      data: { chatId, senderId, text, replyToId: replyToId || null, status: MessageStatus.SENT },
      include: {
        sender: { select: USER_SELECT },
        replyTo: { include: { sender: { select: USER_SELECT } } },
      },
    });

    // Update chat timestamp & increment unread for others
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    return formatMessage(message);
  },

<<<<<<< HEAD
  async sendMediaMessage(
    chatId: string,
    senderId: string,
    mediaUrl: string,
    mediaType: MediaType
  ) {
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: senderId } },
    });
=======
  async sendMediaMessage(chatId: string, senderId: string, mediaUrl: string, mediaType: MediaType) {
    const participant = await prisma.chatParticipant.findUnique({ where: { chatId_userId: { chatId, userId: senderId } } });
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    if (!participant) throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });

    const message = await prisma.message.create({
      data: { chatId, senderId, mediaUrl, mediaType, status: MessageStatus.SENT },
<<<<<<< HEAD
      include: {
        sender: { select: USER_SELECT },
        replyTo: null,
      },
=======
      include: { sender: { select: USER_SELECT }, replyTo: null },
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    });

    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    return formatMessage(message);
  },

  async markSeen(chatId: string, userId: string) {
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { unreadCount: 0, lastReadAt: new Date() },
    });
<<<<<<< HEAD
    await prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        status: { not: MessageStatus.SEEN },
        deletedAt: null,
      },
=======
    // Mark all messages as SEEN
    await prisma.message.updateMany({
      where: { chatId, senderId: { not: userId }, status: { not: MessageStatus.SEEN } },
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
      data: { status: MessageStatus.SEEN },
    });
  },

  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
<<<<<<< HEAD
    if (!message || message.senderId !== userId) {
      throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });
    }
    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  },
};

// ── Shared formatter ──────────────────────────────────────────────────────────

function formatMessage(msg: {
  id: string; chatId: string; senderId: string; text: string | null;
  mediaUrl: string | null; mediaType: string | null; status: string;
  replyToId: string | null; deletedAt: Date | null; createdAt: Date; updatedAt: Date;
  sender?: unknown; replyTo?: unknown;
}) {
  const deleted = !!msg.deletedAt;
=======
    if (!message || message.senderId !== userId) throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });
    await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
  },
};

function formatMessage(msg: any) {
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
  return {
    id: msg.id,
    chatId: msg.chatId,
    senderId: msg.senderId,
<<<<<<< HEAD
    text: deleted ? null : msg.text,
    mediaUrl: deleted ? null : msg.mediaUrl,
    mediaType: msg.mediaType ? msg.mediaType.toLowerCase() : null,
    status: msg.status.toLowerCase(),
    replyToId: msg.replyToId,
    replyTo: msg.replyTo ?? null,
    sender: msg.sender ?? null,
    createdAt: msg.createdAt.toISOString(),
    updatedAt: msg.updatedAt.toISOString(),
=======
    text: msg.deletedAt ? null : msg.text,
    mediaUrl: msg.deletedAt ? null : msg.mediaUrl,
    mediaType: msg.mediaType?.toLowerCase() || null,
    status: msg.status.toLowerCase(),
    replyToId: msg.replyToId,
    replyTo: msg.replyTo ? {
      id: msg.replyTo.id,
      text: msg.replyTo.text,
      senderId: msg.replyTo.senderId,
      createdAt: msg.replyTo.createdAt,
    } : null,
    sender: msg.sender,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
  };
}
