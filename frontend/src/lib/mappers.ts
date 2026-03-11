// © Danial Mohmad — All Rights Reserved
// Row-to-domain mappers: convert Supabase snake_case rows → app camelCase types.
// Only this file should know about the DB column names.
import type { User, Message, Chat } from "../types";

// ── Profile → User ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProfile(row: any): User {
  return {
    id: row.id,
    appId: row.app_id,
    email: row.email ?? "",           // email not stored in profiles, caller can supply
    displayName: row.display_name,
    avatar: row.avatar_url ?? null,
    bio: row.bio ?? "",
    online: row.online ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Message row → Message ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapMessage(row: any): Message {
  const deleted = !!row.deleted_at;
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    text: deleted ? null : (row.text ?? null),
    mediaUrl: deleted ? null : (row.media_url ?? null),
    mediaType: row.media_type ?? null,
    status: (row.status ?? "sent") as Message["status"],
    replyToId: row.reply_to_id ?? null,
    replyTo: row.reply_to
      ? {
          id: row.reply_to.id,
          text: row.reply_to.text,
          senderId: row.reply_to.sender_id,
          createdAt: row.reply_to.created_at,
        }
      : null,
    sender: row.sender ? mapProfile(row.sender) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Chat assembly ─────────────────────────────────────────────────────────────

export function assembleChat(
  chatRow: { id: string; type: string; created_at: string; updated_at: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participantRows: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastMessageRow: any | null,
  unreadCount: number
): Chat {
  return {
    id: chatRow.id,
    participants: participantRows.map(p => mapProfile(p.profiles ?? p)),
    lastMessage: lastMessageRow ? mapMessage(lastMessageRow) : null,
    unreadCount,
    createdAt: chatRow.created_at,
    updatedAt: chatRow.updated_at,
  };
}

export function getMediaType(filename: string): Message["mediaType"] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  if (["mp3", "ogg", "wav", "m4a"].includes(ext)) return "audio";
  return "file";
}
