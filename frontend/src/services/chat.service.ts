// © Danial Mohmad — All Rights Reserved
import api from "./api";
import type { Chat, Message } from "../types";

export const chatService = {
  async getChats(): Promise<Chat[]> {
    const { data } = await api.get<Chat[]>("/chats");
    return data;
  },

  async getOrCreateChat(userId: string): Promise<Chat> {
    const { data } = await api.post<Chat>("/chats", { participantId: userId });
    return data;
  },

  async getMessages(chatId: string, cursor?: string): Promise<Message[]> {
    const params = cursor ? { cursor } : {};
    const { data } = await api.get<Message[]>(`/chats/${chatId}/messages`, { params });
    return data;
  },

  async sendMessage(chatId: string, text: string, replyToId?: string): Promise<Message> {
    const { data } = await api.post<Message>(`/chats/${chatId}/messages`, {
      text,
      ...(replyToId ? { replyToId } : {}),
    });
    return data;
  },

  async markSeen(chatId: string): Promise<void> {
    await api.post(`/chats/${chatId}/seen`);
  },

  async uploadMedia(chatId: string, file: File): Promise<Message> {
    const form = new FormData();
    form.append("file", file);
    form.append("chatId", chatId);
    const { data } = await api.post<Message>(`/chats/${chatId}/media`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async deleteMessage(messageId: string, forEveryone = false): Promise<void> {
    await api.delete(`/messages/${messageId}`, { data: { forEveryone } });
  },
};
