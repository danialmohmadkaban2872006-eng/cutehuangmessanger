// © Danial Mohmad — All Rights Reserved
import prisma from "../config/prisma";
import { MessageStatus, MediaType } from "@prisma/client";

const USER_SELECT = { id: true, appId: true, displayName: true, avatar: true, bio: true, online: true, email: true, createdAt: true, updatedAt: true };

export const chatService = {
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
      return {
        id: existing.id,
        participants: existing.participants.map(cp => cp.user),
        lastMessage: existing.messages[0] ? formatMessage(existing.messages[0]) : null,
        unreadCount: 0,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
      };
    }

    // Create new direct chat
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
    // Verify user is participant
    const participant = await prisma.chatParticipant.findUnique({ where: { chatId_userId: { chatId, userId } } });
    if (!participant) throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: { select: USER_SELECT },
        replyTo: { include: { sender: { select: USER_SELECT } } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return messages.map(formatMessage);
  },

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
    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    await prisma.chatParticipant.updateMany({
      where: { chatId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    return formatMessage(message);
  },

  async sendMediaMessage(chatId: string, senderId: string, mediaUrl: string, mediaType: MediaType) {
    const participant = await prisma.chatParticipant.findUnique({ where: { chatId_userId: { chatId, userId: senderId } } });
    if (!participant) throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });

    const message = await prisma.message.create({
      data: { chatId, senderId, mediaUrl, mediaType, status: MessageStatus.SENT },
      include: { sender: { select: USER_SELECT }, replyTo: null },
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
    // Mark all messages as SEEN
    await prisma.message.updateMany({
      where: { chatId, senderId: { not: userId }, status: { not: MessageStatus.SEEN } },
      data: { status: MessageStatus.SEEN },
    });
  },

  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== userId) throw Object.assign(new Error("Forbidden"), { code: "FORBIDDEN" });
    await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
  },
};

function formatMessage(msg: any) {
  return {
    id: msg.id,
    chatId: msg.chatId,
    senderId: msg.senderId,
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
  };
}
