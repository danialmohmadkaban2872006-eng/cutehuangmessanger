// © Danial Mohmad — All Rights Reserved
import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import Avatar from "./ui/Avatar";
import Icon from "./ui/Icon";
import { userService } from "../services/user.service";
import toast from "react-hot-toast";

export default function ProfilePanel() {
  const { t, theme, currentUser, updateProfile, copyAppId, copiedId } = useApp();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ displayName, bio });
      setEditing(false);
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { avatarUrl } = await userService.uploadAvatar(file);
      await updateProfile({ avatar: avatarUrl });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${theme.border}`, background: theme.bg,
    color: theme.text, fontFamily: "inherit", outline: "none", marginBottom: 12,
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, color: theme.text }}>{t.profile}</h2>

      {/* Avatar */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <Avatar user={currentUser} size={80} />
          <button onClick={() => fileRef.current?.click()} style={{
            position: "absolute", bottom: 0, right: 0,
            width: 28, height: 28, borderRadius: "50%", border: "none",
            background: COLORS.primary, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="edit" size={13} color="#fff" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
        <div style={{ marginTop: 10, fontWeight: 700, fontSize: 17, color: theme.text }}>{currentUser?.displayName}</div>
        <div style={{ fontSize: 13, color: theme.textMuted }}>#{currentUser?.appId}</div>
      </div>

      {/* App ID card */}
      <div style={{
        padding: 16, borderRadius: 14, border: `1.5px solid ${theme.border}`,
        marginBottom: 16, background: theme.surface,
      }}>
        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>{t.yourAppId}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 18, letterSpacing: "0.08em", color: theme.text }}>
            {currentUser?.appId}
          </span>
          <button onClick={copyAppId} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
            border: `1px solid ${theme.border}`, background: copiedId ? COLORS.success : "transparent",
            color: copiedId ? "#fff" : COLORS.primaryDark, cursor: "pointer", fontSize: 12, fontWeight: 600,
            transition: "all 0.2s",
          }}>
            <Icon name="copy" size={13} color={copiedId ? "#fff" : COLORS.primaryDark} />
            {copiedId ? t.copied : t.copyId}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing ? (
        <div>
          <label style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4, display: "block" }}>{t.displayName}</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} />
          <label style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4, display: "block" }}>{t.bio}</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: "none" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: 10, borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              color: "#fff", fontWeight: 600, cursor: "pointer",
            }}>{saving ? "..." : t.save}</button>
            <button onClick={() => setEditing(false)} style={{
              flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid ${theme.border}`,
              background: "transparent", color: theme.text, fontWeight: 600, cursor: "pointer",
            }}>{t.cancel}</button>
          </div>
        </div>
      ) : (
        <div>
          {currentUser?.bio && (
            <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 16, background: theme.surface }}>
              <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>{t.bio}</div>
              <div style={{ fontSize: 14, color: theme.text }}>{currentUser.bio}</div>
            </div>
          )}
          <div style={{ padding: 14, borderRadius: 12, border: `1px solid ${theme.border}`, marginBottom: 16, background: theme.surface }}>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 4 }}>{t.email}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>{currentUser?.email}</div>
          </div>
          <button onClick={() => setEditing(true)} style={{
            width: "100%", padding: 12, borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
            color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Icon name="edit" size={16} color="#fff" /> {t.editProfile}
          </button>
        </div>
      )}
    </div>
  );
}
