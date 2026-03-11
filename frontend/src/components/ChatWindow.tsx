// © Danial Mohmad — All Rights Reserved
import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import Avatar from "./ui/Avatar";
import Icon from "./ui/Icon";
import type { Message } from "../types";
import { format } from "date-fns";

const EMOJIS = ["😊","❤️","😂","👍","🔥","😍","🎉","🙏","💯","😢","😮","👋"];

function MessageBubble({ msg, isOwn, theme }: { msg: Message; isOwn: boolean; theme: ReturnType<typeof useApp>["theme"] }) {
  const [showMenu, setShowMenu] = useState(false);
  const { t } = useApp();

  const statusIcon = isOwn ? (
    msg.status === "seen" ? <Icon name="checkDouble" size={13} color={COLORS.accent} /> :
    msg.status === "delivered" ? <Icon name="checkDouble" size={13} color={theme.textMuted} /> :
    msg.status === "sent" ? <Icon name="check" size={13} color={theme.textMuted} /> : null
  ) : null;

  return (
    <div style={{
      display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start",
      marginBottom: 6, position: "relative", animation: "fadeIn 0.15s ease",
    }}>
      <div
        style={{
          maxWidth: "70%", padding: "10px 14px", borderRadius: isOwn ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          background: isOwn ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` : theme.surface,
          color: isOwn ? "#fff" : theme.text, fontSize: 14, lineHeight: 1.5, wordBreak: "break-word",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          border: isOwn ? "none" : `1px solid ${theme.border}`,
          cursor: "context-menu",
        }}
        onContextMenu={e => { e.preventDefault(); setShowMenu(!showMenu); }}
      >
        {msg.replyTo && (
          <div style={{
            fontSize: 12, padding: "4px 8px", borderRadius: 6, marginBottom: 6,
            background: isOwn ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)",
            borderLeft: `3px solid ${isOwn ? "rgba(255,255,255,0.5)" : COLORS.primary}`,
          }}>
            {msg.replyTo.text}
          </div>
        )}
        {msg.mediaUrl && msg.mediaType === "image" && (
          <img src={msg.mediaUrl} alt="media" style={{ maxWidth: 240, borderRadius: 8, marginBottom: 4, display: "block" }} />
        )}
        {msg.text && <span>{msg.text}</span>}
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginTop: 4, opacity: 0.7 }}>
          <span style={{ fontSize: 11 }}>{format(new Date(msg.createdAt), "HH:mm")}</span>
          {statusIcon}
        </div>
      </div>

      {showMenu && (
        <div style={{
          position: "absolute", [isOwn ? "right" : "left"]: 0, bottom: "100%",
          background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10, overflow: "hidden", minWidth: 160,
        }}>
          {[
            { icon: "reply", label: t.replyTo },
            { icon: "trash", label: t.deleteMessage, danger: true },
          ].map((item, i) => (
            <div key={i} onClick={() => setShowMenu(false)} style={{
              padding: "10px 16px", fontSize: 14, display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", color: item.danger ? COLORS.error : theme.text,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = theme.bg)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Icon name={item.icon} size={15} color={item.danger ? COLORS.error : theme.textMuted} />
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatWindow() {
  const { t, theme, activeChat, messages, sendMessage, sendMedia, currentUser, typingUsers, emitTyping, callState, setCallState } = useApp();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  const partner = activeChat?.participants.find(p => p.id !== currentUser?.id);
  const chatMessages = activeChat ? (messages[activeChat.id] || []) : [];
  const isPartnerTyping = activeChat ? (typingUsers[activeChat.id] || []).includes(partner?.id || "") : false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length, isPartnerTyping]);

  const handleTextChange = (v: string) => {
    setText(v);
    if (!activeChat) return;
    emitTyping(activeChat.id, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(activeChat.id, false), 2000);
  };

  const handleSend = useCallback(() => {
    if (!text.trim() || !activeChat) return;
    sendMessage(activeChat.id, text.trim(), replyTo?.id);
    setText("");
    setReplyTo(null);
    setShowEmoji(false);
    emitTyping(activeChat.id, false);
  }, [text, activeChat, replyTo, sendMessage, emitTyping]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChat) await sendMedia(activeChat.id, file);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (!activeChat || !partner) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: theme.bg, color: theme.textMuted,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", marginBottom: 20,
          background: `rgba(232,165,152,0.1)`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="messageCircle" size={36} color={COLORS.primary} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600 }}>{t.noChats}</p>
        <p style={{ fontSize: 13, marginTop: 8 }}>{t.startChat}</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: theme.bg, position: "relative" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
        background: theme.surface, borderBottom: `1px solid ${theme.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <Avatar user={partner} size={40} showOnline />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{partner.displayName}</div>
          <div style={{ fontSize: 12, color: isPartnerTyping ? COLORS.primary : theme.textMuted, fontStyle: isPartnerTyping ? "italic" : "normal" }}>
            {isPartnerTyping ? t.typing : (partner.online ? t.online : t.offline)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setCallState({ type: "voice", partner, direction: "outgoing" })} style={{
            width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
            background: `rgba(232,165,152,0.1)`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="phone" size={17} color={COLORS.primary} />
          </button>
          <button onClick={() => setCallState({ type: "video", partner, direction: "outgoing" })} style={{
            width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
            background: `rgba(232,165,152,0.1)`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="video" size={17} color={COLORS.primary} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {chatMessages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === currentUser?.id} theme={theme} />
        ))}
        {isPartnerTyping && (
          <div style={{ display: "flex", gap: 4, padding: "8px 0" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: COLORS.primary,
                animation: `ping 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div style={{
          margin: "0 16px", padding: "8px 12px", borderRadius: "8px 8px 0 0",
          background: `rgba(232,165,152,0.1)`, borderLeft: `3px solid ${COLORS.primary}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, color: theme.textMuted }}>{replyTo.text}</span>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="x" size={14} color={theme.textMuted} />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div style={{
          padding: "12px 16px", background: theme.surface, borderTop: `1px solid ${theme.border}`,
          display: "flex", flexWrap: "wrap", gap: 8,
        }}>
          {EMOJIS.map(emoji => (
            <span key={emoji} onClick={() => { setText(p => p + emoji); setShowEmoji(false); }}
              style={{ fontSize: 22, cursor: "pointer", padding: 4 }}>{emoji}</span>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 8, padding: "12px 16px",
        background: theme.surface, borderTop: `1px solid ${theme.border}`,
      }}>
        <button onClick={() => { setShowEmoji(!showEmoji); }} style={{
          width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="smile" size={20} color={theme.textMuted} />
        </button>
        <button onClick={() => fileRef.current?.click()} style={{
          width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="paperclip" size={20} color={theme.textMuted} />
        </button>
        <input type="file" ref={fileRef} onChange={handleFile} style={{ display: "none" }} accept="image/*,video/*,audio/*" />
        <textarea
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={t.typeMessage}
          rows={1}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 20, border: `1.5px solid ${theme.border}`,
            background: theme.bg, color: theme.text, fontSize: 14, outline: "none",
            fontFamily: "inherit", resize: "none", maxHeight: 120, lineHeight: 1.5,
          }}
          onFocus={e => (e.target.style.borderColor = COLORS.primary)}
          onBlur={e => (e.target.style.borderColor = theme.border)}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            width: 40, height: 40, borderRadius: "50%", border: "none",
            background: text.trim() ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` : theme.border,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: text.trim() ? "pointer" : "default",
            flexShrink: 0, transition: "background 0.2s",
          }}
        >
          <Icon name="send" size={17} color="#fff" />
        </button>
      </div>
    </div>
  );
}
