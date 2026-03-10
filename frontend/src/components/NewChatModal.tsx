// © Danial Mohmad — All Rights Reserved
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import Avatar from "./ui/Avatar";
import Icon from "./ui/Icon";
import type { User } from "../types";

interface Props { onClose: () => void; }

export default function NewChatModal({ onClose }: Props) {
  const { t, theme, searchById, startChat } = useApp();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<User | null | "notfound">(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const user = await searchById(query.trim());
    setResult(user ?? "notfound");
    setLoading(false);
  };

  const handleStart = async () => {
    if (!result || result === "notfound") return;
    await startChat(result.id);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: theme.surface, borderRadius: 20, padding: 28, width: "100%", maxWidth: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: theme.text }}>{t.newChat}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <Icon name="x" size={20} color={theme.textMuted} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder={t.searchById}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${theme.border}`,
              background: theme.bg, color: theme.text, fontSize: 14, outline: "none", fontFamily: "inherit",
            }}
            onFocus={e => (e.target.style.borderColor = COLORS.primary)}
            onBlur={e => (e.target.style.borderColor = theme.border)}
          />
          <button onClick={handleSearch} disabled={loading} style={{
            padding: "10px 16px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14,
          }}>
            {loading ? "..." : <Icon name="search" size={18} color="#fff" />}
          </button>
        </div>

        {result === "notfound" && (
          <div style={{ textAlign: "center", padding: 20, color: theme.textMuted, fontSize: 14 }}>
            No user found with that App ID.
          </div>
        )}

        {result && result !== "notfound" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: 14,
            borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.bg,
          }}>
            <Avatar user={result} size={44} showOnline />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: theme.text }}>{result.displayName}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, fontFamily: "monospace" }}>#{result.appId}</div>
            </div>
            <button onClick={handleStart} style={{
              padding: "8px 16px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13,
            }}>
              {t.startChat}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
