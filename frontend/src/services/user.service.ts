// © Danial Mohmad — All Rights Reserved
import api from "./api";
import type { User } from "../types";

export const userService = {
  async searchByAppId(appId: string): Promise<User | null> {
    try {
      const { data } = await api.get<User>(`/users/search?appId=${appId}`);
      return data;
    } catch {
      return null;
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data } = await api.patch<User>("/users/me", updates);
    return data;
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const form = new FormData();
    form.append("avatar", file);
    const { data } = await api.post<{ avatarUrl: string }>("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
