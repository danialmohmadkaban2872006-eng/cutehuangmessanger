// © Danial Mohmad — All Rights Reserved
<<<<<<< HEAD
import supabase from "../lib/supabase";
import { mapProfile } from "../lib/mappers";
import type { User } from "../types";

export const userService = {

  async searchByAppId(appId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, app_id, display_name, avatar_url, bio, online, created_at, updated_at")
      .eq("app_id", appId.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("[searchByAppId]", error);
      return null;
    }
    return data ? mapProfile(data) : null;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id, app_id, display_name, avatar_url, bio, online, created_at, updated_at")
      .single();

    if (error) throw error;
    return mapProfile(data);
  },

  /**
   * Upload a new avatar to Supabase Storage.
   * Returns { avatarUrl } to keep ProfilePanel.tsx interface unchanged.
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (uploadErr) throw uploadErr;

    // Append cache-busting query param so the browser re-fetches the new avatar
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const avatarUrl = `${publicUrl}?v=${Date.now()}`;
    return { avatarUrl };
  },

  /** Mark user as online/offline in the profiles table. */
  async setOnline(userId: string, online: boolean): Promise<void> {
    await supabase
      .from("profiles")
      .update({ online, last_seen: new Date().toISOString() })
      .eq("id", userId);
  },

  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, app_id, display_name, avatar_url, bio, online, created_at, updated_at")
      .eq("id", userId)
      .single();
    if (error) return null;
    return mapProfile(data);
=======
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
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
  },
};
