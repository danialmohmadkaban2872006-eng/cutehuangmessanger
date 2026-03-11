// © Danial Mohmad — All Rights Reserved
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import Avatar from "./ui/Avatar";
import Icon from "./ui/Icon";
import { formatDistanceToNowStrict } from "date-fns";
import type { Chat } from "../types";

interface Props {
  onSelectChat?: () => void;
}

export default function ChatList({ onSelectChat }: Props) {
  const { t, theme, chats, activeChat, setActiveChat, markSeen, currentUser, typingUsers } = useApp();
  const [search, setSearch] = useState("");

  const filtered = chats
    .filter(c => {
      const partner = c.participants.find(p => p.id !== currentUser?.id);
      return !search || partner?.displayName.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleSelect = (chat: Chat) => {
    setActiveChat(chat);
    markSeen(chat.id);
    onSelectChat?.();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Search */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: theme.bg, borderRadius: 10, padding: "8px 12px",
          border: `1px solid ${theme.border}`,
        }}>
          <Icon name="search" size={16} color={theme.textMuted} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", fontSize: 14, color: theme.text, fontFamily: "inherit",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <Icon name="x" size={14} color={theme.textMuted} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: theme.textMuted }}>
            <Icon name="messageCircle" size={36} color={theme.border} />
            <p style={{ marginTop: 12, fontSize: 14 }}>{t.noChats}</p>
            <p style={{ marginTop: 4, fontSize: 12 }}>{t.startChat}</p>
          </div>
        )}
        {filtered.map(chat => {
          const partner = chat.participants.find(p => p.id !== currentUser?.id);
          const isActive = activeChat?.id === chat.id;
          const isTyping = (typingUsers[chat.id] || []).length > 0;
          const lastMsg = chat.lastMessage;
          const timeStr = lastMsg
            ? formatDistanceToNowStrict(new Date(lastMsg.createdAt), { addSuffix: false })
            : "";

          return (
            <div
              key={chat.id}
              onClick={() => handleSelect(chat)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", cursor: "pointer",
                background: isActive ? "rgba(232,165,152,0.1)" : "transparent",
                borderLeft: isActive ? `3px solid ${COLORS.primary}` : "3px solid transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = theme.bg;
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Avatar user={partner} size={46} showOnline />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: theme.text }}>
                    {partner?.displayName ?? "Unknown"}
                  </span>
                  <span style={{ fontSize: 11, color: theme.textMuted, flexShrink: 0, marginLeft: 8 }}>
                    {timeStr}
                  </span>
                </div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginTop: 2,
                }}>
                  <span style={{
                    fontSize: 13,
                    color: isTyping ? COLORS.primary : theme.textMuted,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontStyle: isTyping ? "italic" : "normal",
                  }}>
                    {isTyping
                      ? t.typing
                      : lastMsg?.text ?? (lastMsg?.mediaUrl ? "📎 Media" : "")}
                  </span>
                  {(chat.unreadCount || 0) > 0 && (
                    <span style={{
                      background: COLORS.primary, color: "#fff",
                      borderRadius: 10, fontSize: 11, fontWeight: 700,
                      padding: "1px 7px", flexShrink: 0, marginLeft: 6,
                    }}>
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
