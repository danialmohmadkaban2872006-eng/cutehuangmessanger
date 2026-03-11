// © Danial Mohmad — All Rights Reserved
<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useState } from "react";
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
import { useApp } from "../context/AppContext";
import { COLORS } from "../constants/colors";
import Avatar from "./ui/Avatar";
import Icon from "./ui/Icon";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import ProfilePanel from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";
import NewChatModal from "./NewChatModal";
import CallOverlay from "./CallOverlay";

type Section = "chats" | "calls" | "profile" | "settings";

const NAV_ITEMS: { key: Section; icon: string }[] = [
  { key: "chats", icon: "messageCircle" },
  { key: "calls", icon: "phone" },
  { key: "profile", icon: "user" },
  { key: "settings", icon: "compass" },
];

export default function AppShell() {
<<<<<<< HEAD
  const {
    t, theme, appSection, setAppSection, currentUser, callState,
    mobileSidebarOpen, setMobileSidebarOpen, activeChat,
  } = useApp();
  const [showNewChat, setShowNewChat] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // On mobile: show sidebar OR chat (mutually exclusive)
  const showSidebar = !isMobile || mobileSidebarOpen;
  const showChat = !isMobile || !mobileSidebarOpen;

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: theme.bg,
      fontFamily: "'DM Sans', sans-serif",
      overflow: "hidden",
=======
  const { t, theme, appSection, setAppSection, currentUser, callState, mobileSidebarOpen, setMobileSidebarOpen, activeChat } = useApp();
  const [showNewChat, setShowNewChat] = useState(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const showSidebar = !isMobile || mobileSidebarOpen || !activeChat;
  const showMain = !isMobile || (!mobileSidebarOpen && activeChat) || appSection !== "chats";

  return (
    <div style={{
      display: "flex", height: "100vh", background: theme.bg,
      fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
      direction: "ltr",
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
    }}>
      {callState && <CallOverlay />}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}

<<<<<<< HEAD
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {showSidebar && (
        <div style={{
          width: isMobile ? "100vw" : 320,
          display: "flex",
          flexDirection: "column",
          background: theme.surface,
          borderRight: `1px solid ${theme.border}`,
          flexShrink: 0,
          ...(isMobile ? { position: "absolute", inset: 0, zIndex: 50 } : {}),
        }}>
          {/* Sidebar header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: `1px solid ${theme.border}`,
            flexShrink: 0,
=======
      {/* Sidebar */}
      {(showSidebar || appSection !== "chats") && (
        <div style={{
          width: 320, display: "flex", flexDirection: "column",
          background: theme.surface, borderRight: `1px solid ${theme.border}`,
          flexShrink: 0,
          ...(isMobile ? { position: "absolute", inset: "0 auto 0 0", zIndex: 50, width: "100vw" } : {}),
        }}>
          {/* Sidebar Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderBottom: `1px solid ${theme.border}`,
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="messageCircle" size={16} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>
<<<<<<< HEAD
                {appSection === "chats" ? t.messages
                  : appSection === "calls" ? t.calls
                  : appSection === "profile" ? t.profile
                  : t.settings}
              </span>
            </div>
            {appSection === "chats" && (
              <button
                onClick={() => setShowNewChat(true)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                  background: "rgba(232,165,152,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
=======
                {appSection === "chats" ? t.messages : appSection === "calls" ? t.calls : appSection === "profile" ? t.profile : t.settings}
              </span>
            </div>
            {appSection === "chats" && (
              <button onClick={() => setShowNewChat(true)} style={{
                width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                background: `rgba(232,165,152,0.15)`, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
                <Icon name="plus" size={18} color={COLORS.primary} />
              </button>
            )}
          </div>

<<<<<<< HEAD
          {/* Sidebar content */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {appSection === "chats" && (
              <ChatList onSelectChat={() => { if (isMobile) setMobileSidebarOpen(false); }} />
            )}
            {appSection === "profile" && <ProfilePanel />}
            {appSection === "settings" && <SettingsPanel />}
            {appSection === "calls" && (
              <div style={{
                flex: 1, display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column", color: theme.textMuted,
              }}>
=======
          {/* Content area */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {appSection === "chats" && <ChatList />}
            {appSection === "profile" && <ProfilePanel />}
            {appSection === "settings" && <SettingsPanel />}
            {appSection === "calls" && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: theme.textMuted }}>
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
                <Icon name="phone" size={40} color={theme.border} />
                <p style={{ marginTop: 16, fontSize: 14 }}>{t.calls} — coming soon</p>
              </div>
            )}
          </div>

<<<<<<< HEAD
          {/* Bottom nav */}
          <div style={{
            display: "flex",
            borderTop: `1px solid ${theme.border}`,
            padding: "6px 0",
            flexShrink: 0,
=======
          {/* Bottom Nav */}
          <div style={{
            display: "flex", borderTop: `1px solid ${theme.border}`, padding: "6px 0",
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
          }}>
            {NAV_ITEMS.map(item => {
              const isActive = appSection === item.key;
              return (
<<<<<<< HEAD
                <button
                  key={item.key}
                  onClick={() => {
                    setAppSection(item.key);
                    if (isMobile) setMobileSidebarOpen(true);
                  }}
                  style={{
                    flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                    background: "transparent",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    position: "relative",
                  }}
                >
                  {item.key === "profile" ? (
                    <Avatar user={currentUser} size={22} />
                  ) : (
                    <Icon
                      name={item.icon}
                      size={22}
                      color={isActive ? COLORS.primary : theme.textMuted}
                    />
                  )}
                  {isActive && (
                    <div style={{
                      position: "absolute", bottom: 0, left: "50%",
                      transform: "translateX(-50%)",
                      width: 20, height: 3, borderRadius: 2,
                      background: COLORS.primary,
=======
                <button key={item.key} onClick={() => { setAppSection(item.key); if (isMobile) setMobileSidebarOpen(true); }} style={{
                  flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                  background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  position: "relative",
                }}>
                  {item.key === "profile" ? (
                    <Avatar user={currentUser} size={22} />
                  ) : (
                    <Icon name={item.icon} size={22} color={isActive ? COLORS.primary : theme.textMuted} />
                  )}
                  {isActive && (
                    <div style={{
                      position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                      width: 20, height: 3, borderRadius: 2, background: COLORS.primary,
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* ── Main chat area — always visible on desktop ──────────────────── */}
      {showChat && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {/* Mobile back button */}
          {isMobile && activeChat && (
            <button
              onClick={() => setMobileSidebarOpen(true)}
              style={{
                position: "absolute", top: 16, left: 14, zIndex: 10,
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
                color: theme.textMuted,
              }}
            >
              <Icon name="arrow" size={20} color={theme.text} />
            </button>
=======
      {/* Main area */}
      {appSection === "chats" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {isMobile && activeChat && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, zIndex: 40,
              display: "flex", alignItems: "center", padding: "8px 12px",
              background: theme.surface, borderBottom: `1px solid ${theme.border}`,
            }}>
              <button onClick={() => setMobileSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="arrow" size={20} color={theme.text} />
              </button>
            </div>
>>>>>>> d2bbc2438c1412cd08031520573891ee09832ada
          )}
          <ChatWindow />
        </div>
      )}
    </div>
  );
}
