// © Danial Mohmad — All Rights Reserved
import {
  createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode,
} from "react";
import type { User, Chat, Message, CallState, AppContextType, Language, ThemeColors } from "../types";
import { COLORS, RTL_LANGUAGES } from "../constants/colors";
import { TRANSLATIONS } from "../constants/translations";
import { authService } from "../services/auth.service";
import { chatService } from "../services/chat.service";
import { userService } from "../services/user.service";
import { useRealtime } from "../hooks/useRealtime";
import supabase from "../lib/supabase";

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<"landing" | "auth" | "app">("landing");
  const [appSection, setAppSection] = useState<"chats" | "calls" | "profile" | "settings">("chats");
  const [lang, setLang] = useState<Language>(
    () => (localStorage.getItem("lang") as Language) || "en"
  );
  const [darkMode, setDarkModeState] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeChat, setActiveChatState] = useState<Chat | null>(null);
  const [callState, setCallState] = useState<CallState | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [copiedId, setCopiedId] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const t = TRANSLATIONS[lang];
  const isRTL = RTL_LANGUAGES.includes(lang);

  const theme: ThemeColors = {
    bg: darkMode ? COLORS.dark.surface : COLORS.surfaceDim,
    surface: darkMode ? COLORS.dark.surfaceCard : COLORS.surfaceCard,
    border: darkMode ? COLORS.dark.border : COLORS.border,
    text: darkMode ? COLORS.dark.text : COLORS.text,
    textMuted: darkMode ? COLORS.dark.textMuted : COLORS.textMuted,
  };

  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);

  const setDarkMode = (v: boolean) => {
    setDarkModeState(v);
    localStorage.setItem("darkMode", String(v));
  };

  // ── Session restoration via Supabase auth state ───────────────────────────
  // Supabase handles token refresh automatically.
  // We subscribe to auth changes to keep the app in sync.
  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = await userService.getProfile(session.user.id);
          if (profile) {
            setCurrentUser(profile);
            setPage("app");
          }
        } catch (err) {
          console.error("[session restore]", err);
        }
      }
    });

    // Subscribe to future auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setCurrentUser(null);
          setChats([]);
          setMessages({});
          setActiveChatState(null);
          setPage("landing");
          return;
        }
        // SIGNED_IN or TOKEN_REFRESHED: ensure profile is fresh
        if (event === "SIGNED_IN" && session.user) {
          const profile = await userService.getProfile(session.user.id);
          if (profile) {
            setCurrentUser(profile);
            setPage("app");
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load chats when entering the app
  useEffect(() => {
    if (page === "app" && currentUser) {
      chatService.getChats(currentUser.id).then(setChats).catch(console.error);
    }
  }, [page, currentUser]);

  // Mark online on app open, offline on unload
  useEffect(() => {
    if (!currentUser) return;
    userService.setOnline(currentUser.id, true).catch(() => {});
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        userService.setOnline(currentUser.id, false).catch(() => {});
      } else {
        userService.setOnline(currentUser.id, true).catch(() => {});
      }
    };
    const handleUnload = () => {
      userService.setOnline(currentUser.id, false).catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [currentUser]);

  // ── Realtime handlers ─────────────────────────────────────────────────────

  const handleNewMessage = useCallback((msg: Message) => {
    setMessages(prev => {
      const existing = prev[msg.chatId] ?? [];
      // Deduplicate by id — prevents double insert from optimistic + realtime
      if (existing.some(m => m.id === msg.id)) return prev;
      return { ...prev, [msg.chatId]: [...existing, msg] };
    });
    setChats(prev =>
      prev.map(c =>
        c.id === msg.chatId
          ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
          : c
      )
    );
  }, []);

  const handleTyping = useCallback((event: { chatId: string; userId: string; isTyping: boolean }) => {
    const { chatId, userId, isTyping } = event;
    setTypingUsers(prev => {
      const current = prev[chatId] ?? [];
      if (isTyping && !current.includes(userId)) {
        return { ...prev, [chatId]: [...current, userId] };
      }
      if (!isTyping) {
        return { ...prev, [chatId]: current.filter(id => id !== userId) };
      }
      return prev;
    });
    if (isTyping) {
      const key = `${chatId}:${userId}`;
      clearTimeout(typingTimersRef.current[key]);
      typingTimersRef.current[key] = setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [chatId]: (prev[chatId] ?? []).filter(id => id !== userId),
        }));
      }, 4000);
    }
  }, []);

  const handlePresence = useCallback((event: { userId: string; online: boolean }) => {
    const { userId, online } = event;
    setChats(prev =>
      prev.map(c => ({
        ...c,
        participants: c.participants.map(p =>
          p.id === userId ? { ...p, online } : p
        ),
      }))
    );
  }, []);

  const { emitTyping: _emitTyping } = useRealtime(
    currentUser?.id ?? null,
    activeChat?.id ?? null,
    {
      onMessage: handleNewMessage,
      onTyping: handleTyping,
      onPresence: handlePresence,
    }
  );

  // ── Auth ──────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authService.login(email, password);
      setCurrentUser(res.user);
      setPage("app");
      return true;
    } catch {
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<boolean> => {
    try {
      const res = await authService.register(email, password, displayName);
      setCurrentUser(res.user);
      setPage("app");
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    authService.logout().catch(console.error);
    // onAuthStateChange will clean up state
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    const updated = await userService.updateProfile(data);
    setCurrentUser(updated);
  };

  // ── Chat ──────────────────────────────────────────────────────────────────

  const setActiveChat = useCallback(async (chat: Chat | null): Promise<void> => {
    setActiveChatState(chat);
    if (chat && !messages[chat.id]) {
      try {
        const msgs = await chatService.getMessages(chat.id);
        setMessages(prev => ({ ...prev, [chat.id]: msgs }));
      } catch (err) {
        console.error("[setActiveChat]", err);
      }
    }
  }, [messages]);

  const sendMessage = useCallback(async (
    chatId: string,
    text: string,
    replyToId?: string
  ): Promise<void> => {
    if (!currentUser) return;

    const optimisticId = `opt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimistic: Message = {
      id: optimisticId,
      chatId,
      senderId: currentUser.id,
      text,
      mediaUrl: null,
      mediaType: null,
      status: "sending",
      replyToId: replyToId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] ?? []), optimistic],
    }));

    try {
      const real = await chatService.sendMessage(chatId, currentUser.id, text, replyToId);
      // Replace optimistic with confirmed message
      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] ?? []).map(m => m.id === optimisticId ? real : m),
      }));
      setChats(prev =>
        prev.map(c =>
          c.id === chatId ? { ...c, lastMessage: real, updatedAt: real.createdAt } : c
        )
      );
    } catch {
      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] ?? []).map(m =>
          m.id === optimisticId ? { ...m, status: "failed" as Message["status"] } : m
        ),
      }));
    }
  }, [currentUser]);

  const sendMedia = useCallback(async (chatId: string, file: File): Promise<void> => {
    try {
      const real = await chatService.uploadMedia(chatId, file);
      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] ?? []), real],
      }));
      setChats(prev =>
        prev.map(c =>
          c.id === chatId ? { ...c, lastMessage: real, updatedAt: real.createdAt } : c
        )
      );
    } catch (err) {
      console.error("[sendMedia]", err);
    }
  }, []);

  const startChat = useCallback(async (userId: string): Promise<void> => {
    const chat = await chatService.getOrCreateDirectChat(currentUser!.id, userId);
    setChats(prev => prev.find(c => c.id === chat.id) ? prev : [chat, ...prev]);
    setActiveChatState(chat);
    setAppSection("chats");
    setMobileSidebarOpen(false);
  }, [currentUser]);

  const markSeen = useCallback((chatId: string): void => {
    chatService.markSeen(chatId).catch(console.error);
    setChats(prev =>
      prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c)
    );
  }, []);

  const emitTyping = useCallback((chatId: string, isTyping: boolean): void => {
    _emitTyping(chatId, isTyping);
  }, [_emitTyping]);

  const searchById = useCallback(async (appId: string): Promise<User | null> => {
    return userService.searchByAppId(appId);
  }, []);

  const copyAppId = useCallback((): void => {
    if (currentUser) {
      navigator.clipboard?.writeText(currentUser.appId).catch(() => {});
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  }, [currentUser]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value: AppContextType = {
    currentUser, login, register, logout, updateProfile,
    page, setPage, appSection, setAppSection,
    chats, activeChat, setActiveChat, messages, sendMessage, sendMedia,
    startChat, markSeen, typingUsers, emitTyping,
    lang, setLang, darkMode, setDarkMode, t, theme, isRTL,
    callState, setCallState,
    searchById, copiedId, copyAppId,
    mobileSidebarOpen, setMobileSidebarOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
