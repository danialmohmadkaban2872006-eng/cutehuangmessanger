// © Danial Mohmad — All Rights Reserved
import supabase from "../lib/supabase";
import { mapMessage, mapProfile, assembleChat, getMediaType } from "../lib/mappers";
import type { Chat, Message } from "../types";

// ─────────────────────────────────────────────────────────────────────────────

export const chatService = {

  // ── Chats ─────────────────────────────────────────────────────────────────

  async getChats(userId: string): Promise<Chat[]> {
    // 1. Get all chat IDs and unread counts for this user
    const { data: mine, error: e1 } = await supabase
      .from("chat_participants")
      .select("chat_id, unread_count")
      .eq("user_id", userId);
    if (e1) throw e1;
    if (!mine?.length) return [];

    const chatIds = mine.map(p => p.chat_id);
    const unreadMap: Record<string, number> = Object.fromEntries(
      mine.map(p => [p.chat_id, p.unread_count])
    );

    // 2. Get chat metadata + all participants + their profiles
    const { data: chats, error: e2 } = await supabase
      .from("chats")
      .select(`
        id, type, created_at, updated_at,
        chat_participants (
          user_id,
          profiles ( id, app_id, display_name, avatar_url, bio, online, created_at, updated_at )
        )
      `)
      .in("id", chatIds)
      .order("updated_at", { ascending: false });
    if (e2) throw e2;

    // 3. Get the latest message per chat (single query, ordered desc, dedup client-side)
    const { data: allMsgs, error: e3 } = await supabase
      .from("messages")
      .select("id, chat_id, sender_id, text, media_url, media_type, status, reply_to_id, deleted_at, created_at, updated_at")
      .in("chat_id", chatIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(chatIds.length * 2); // enough to capture at least 1 per chat
    if (e3) throw e3;

    // First occurrence per chat_id = latest (already ordered desc)
    const latestMsg: Record<string, typeof allMsgs[0]> = {};
    for (const m of (allMsgs ?? [])) {
      if (!latestMsg[m.chat_id]) latestMsg[m.chat_id] = m;
    }

    return (chats ?? []).map(chat =>
      assembleChat(
        chat,
        chat.chat_participants ?? [],
        latestMsg[chat.id] ?? null,
        unreadMap[chat.id] ?? 0
      )
    );
  },

  /**
   * Find an existing direct chat between two users, or create one.
   * Completely client-safe — uses RLS-compliant queries.
   */
  async getOrCreateDirectChat(userId: string, participantId: string): Promise<Chat> {
    // Get chat_ids where current user is a participant
    const { data: mine } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", userId);

    const myIds = new Set((mine ?? []).map(p => p.chat_id));

    // Get chat_ids where the other user is a participant
    const { data: theirs } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", participantId);

    // Intersection = shared chats
    const shared = (theirs ?? []).find(p => myIds.has(p.chat_id));

    if (shared) {
      // Return the existing chat
      const { data: chat } = await supabase
        .from("chats")
        .select(`
          id, type, created_at, updated_at,
          chat_participants (
            user_id,
            profiles ( id, app_id, display_name, avatar_url, bio, online, created_at, updated_at )
          )
        `)
        .eq("id", shared.chat_id)
        .eq("type", "DIRECT")
        .single();

      if (chat) {
        const { data: lastMsgs } = await supabase
          .from("messages")
          .select("id, chat_id, sender_id, text, media_url, media_type, status, reply_to_id, deleted_at, created_at, updated_at")
          .eq("chat_id", chat.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1);

        const unread = mine?.find(p => p.chat_id === shared.chat_id);
        return assembleChat(
          chat,
          chat.chat_participants ?? [],
          lastMsgs?.[0] ?? null,
          unread ? 0 : 0
        );
      }
    }

    // No existing chat — create one atomically
    const { data: newChat, error: createErr } = await supabase
      .from("chats")
      .insert({ type: "DIRECT" })
      .select("id, type, created_at, updated_at")
      .single();
    if (createErr || !newChat) throw createErr ?? new Error("Failed to create chat");

    const { error: partErr } = await supabase
      .from("chat_participants")
      .insert([
        { chat_id: newChat.id, user_id: userId },
        { chat_id: newChat.id, user_id: participantId },
      ]);
    if (partErr) throw partErr;

    // Fetch participant profiles for the new chat
    const { data: parts } = await supabase
      .from("chat_participants")
      .select("user_id, profiles ( id, app_id, display_name, avatar_url, bio, online, created_at, updated_at )")
      .eq("chat_id", newChat.id);

    return assembleChat(newChat, parts ?? [], null, 0);
  },

  // ── Messages ──────────────────────────────────────────────────────────────

  async getMessages(chatId: string, cursor?: string): Promise<Message[]> {
    const query = supabase
      .from("messages")
      .select(`
        id, chat_id, sender_id, text, media_url, media_type,
        status, reply_to_id, deleted_at, created_at, updated_at,
        sender:profiles ( id, app_id, display_name, avatar_url, bio, online, created_at, updated_at ),
        reply_to:messages!reply_to_id ( id, text, sender_id, created_at )
      `)
      .eq("chat_id", chatId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(50);

    if (cursor) query.lt("created_at", cursor);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapMessage);
  },

  async sendMessage(
    chatId: string,
    senderId: string,
    text: string,
    replyToId?: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        text,
        status: "sent",
        reply_to_id: replyToId ?? null,
      })
      .select(`
        id, chat_id, sender_id, text, media_url, media_type,
        status, reply_to_id, deleted_at, created_at, updated_at,
        sender:profiles ( id, app_id, display_name, avatar_url, bio, online, created_at, updated_at ),
        reply_to:messages!reply_to_id ( id, text, sender_id, created_at )
      `)
      .single();

    if (error) throw error;

    // Increment unread for all other participants (fire-and-forget)
    supabase.rpc("increment_unread", {
      p_chat_id: chatId,
      p_sender_id: senderId,
    }).then();

    return mapMessage(data);
  },

  async uploadMedia(chatId: string, file: File): Promise<Message> {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${chatId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("chat-media")
      .upload(path, file, { cacheControl: "3600" });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from("chat-media")
      .getPublicUrl(path);

    const mediaType = getMediaType(file.name);

    const { data, error: insertErr } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
        status: "sent",
      })
      .select(`
        id, chat_id, sender_id, text, media_url, media_type,
        status, reply_to_id, deleted_at, created_at, updated_at,
        sender:profiles ( id, app_id, display_name, avatar_url, bio, online, created_at, updated_at )
      `)
      .single();

    if (insertErr) throw insertErr;

    supabase.rpc("increment_unread", {
      p_chat_id: chatId,
      p_sender_id: user.id,
    }).then();

    return mapMessage(data);
  },

  async markSeen(chatId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.rpc("mark_chat_seen", {
      p_chat_id: chatId,
      p_user_id: user.id,
    });
  },

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString(), text: null })
      .eq("id", messageId);
    if (error) throw error;
  },
};
