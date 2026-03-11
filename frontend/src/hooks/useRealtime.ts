// © Danial Mohmad — All Rights Reserved
// Supabase Realtime hook — replaces the old Socket.IO useSocket hook.
// Manages three channels:
//   1. inbox:{userId}    — postgres_changes for new messages (all chats, RLS-filtered)
//   2. typing:{chatId}   — broadcast for typing indicators in the active chat
//   3. online-users      — Supabase Presence for online/offline status
import { useEffect, useRef, useCallback } from "react";
import supabase from "../lib/supabase";
import { mapMessage } from "../lib/mappers";
import type { Message } from "../types";

interface RealtimeHandlers {
  onMessage: (msg: Message) => void;
  onTyping: (event: { chatId: string; userId: string; isTyping: boolean }) => void;
  onPresence: (event: { userId: string; online: boolean }) => void;
}

export function useRealtime(
  userId: string | null,
  activeChatId: string | null,
  handlers: RealtimeHandlers
): { emitTyping: (chatId: string, isTyping: boolean) => void } {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // ── 1. Global inbox subscription (new messages in all user's chats) ────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`inbox:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          // Fetch the full message with sender profile (postgres_changes only returns the raw row)
          const { data, error } = await supabase
            .from("messages")
            .select(`
              id, chat_id, sender_id, text, media_url, media_type,
              status, reply_to_id, deleted_at, created_at, updated_at,
              sender:profiles ( id, app_id, display_name, avatar_url, bio, online, created_at, updated_at ),
              reply_to:messages!reply_to_id ( id, text, sender_id, created_at )
            `)
            .eq("id", payload.new.id)
            .single();

          if (!error && data) {
            handlersRef.current.onMessage(mapMessage(data));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ── 2. Typing broadcast — per active chat ─────────────────────────────────
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Clean up previous typing subscription
    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current);
      typingChannelRef.current = null;
    }

    if (!activeChatId || !userId) return;

    const channel = supabase
      .channel(`typing:${activeChatId}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        // Ignore own typing events reflected back
        if (payload.userId !== userId) {
          handlersRef.current.onTyping(payload as {
            chatId: string;
            userId: string;
            isTyping: boolean;
          });
        }
      })
      .subscribe();

    typingChannelRef.current = channel;

    return () => {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    };
  }, [activeChatId, userId]);

  // ── 3. Presence — online / offline tracking ───────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("online-users", {
        config: { presence: { key: userId } },
      })
      .on("presence", { event: "join" }, ({ key }) => {
        handlersRef.current.onPresence({ userId: key, online: true });
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        handlersRef.current.onPresence({ userId: key, online: false });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId, online: true, ts: Date.now() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ── Emit typing event ─────────────────────────────────────────────────────
  const emitTyping = useCallback(
    (chatId: string, isTyping: boolean) => {
      if (!userId || !typingChannelRef.current) return;
      // Send on the already-subscribed channel for the active chat
      typingChannelRef.current
        .send({
          type: "broadcast",
          event: "typing",
          payload: { chatId, userId, isTyping },
        })
        .catch(() => {}); // swallow errors — typing is best-effort
    },
    [userId]
  );

  return { emitTyping };
}
