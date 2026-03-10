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
import { useSocket, getSocket } from "../hooks/useSocket";

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<"landing" | "auth" | "app">("landing");
  const [appSection, setAppSection] = useState<"chats" | "calls" | "profile" | "settings">("chats");
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem("lang") as Language) || "en");
  const [darkMode, setDarkModeState] = useState(() => localStorage.getItem("darkMode") === "true");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeChat, setActiveChatState] = useState<Chat | null>(null);
  const [callState, setCallState] = useState<CallState | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [copiedId, setCopiedId] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const token = localStorage.getItem("accessToken");
  const t = TRANSLATIONS[lang];
  const isRTL = RTL_LANGUAGES.includes(lang);

  const theme: ThemeColors = {
    bg: darkMode ? COLORS.dark.surface : COLORS.surfaceDim,
    surface: darkMode ? COLORS.dark.surfaceCard : COLORS.surfaceCard,
    border: darkMode ? COLORS.dark.border : COLORS.border,
    text: darkMode ? COLORS.dark.text : COLORS.text,
    textMuted: darkMode ? COLORS.dark.textMuted : COLORS.textMuted,
  };

  // Persist preferences
  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);
  const setDarkMode = (v: boolean) => {
    setDarkModeState(v);
    localStorage.setItem("darkMode", String(v));
  };

  // Restore session on mount
  useEffect(() => {
    const tk = localStorage.getItem("accessToken");
    if (!tk) return;
    authService.me().then(user => {
      setCurrentUser(user);
      setPage("app");
    }).catch(() => {
      authService.logout();
    });
  }, []);

  // Load chats when app page opens
  useEffect(() => {
    if (page === "app" && currentUser) {
      chatService.getChats().then(setChats).catch(console.error);
    }
  }, [page, currentUser]);

  // Socket event handlers
  useSocket(token, {
    onMessage: useCallback((raw: unknown) => {
      const msg = raw as Message;
      setMessages(prev => ({
        ...prev,
        [msg.chatId]: [...(prev[msg.chatId] || []), msg],
      }));
      setChats(prev => prev.map(c =>
        c.id === msg.chatId ? { ...c, lastMessage: msg, updatedAt: msg.createdAt } : c
      ));
    }, []),

    onTyping: useCallback((raw: unknown) => {
      const { chatId, userId, isTyping } = raw as { chatId: string; userId: string; isTyping: boolean };
      setTypingUsers(prev => {
        const current = prev[chatId] || [];
        if (isTyping && !current.includes(userId)) return { ...prev, [chatId]: [...current, userId] };
        if (!isTyping) return { ...prev, [chatId]: current.filter(id => id !== userId) };
        return prev;
      });
      if (isTyping) {
        clearTimeout(typingTimersRef.current[`${chatId}:${userId}`]);
        typingTimersRef.current[`${chatId}:${userId}`] = setTimeout(() => {
          setTypingUsers(prev => ({ ...prev, [chatId]: (prev[chatId] || []).filter(id => id !== userId) }));
        }, 4000);
      }
    }, []),

    onPresence: useCallback((raw: unknown) => {
      const { userId, online } = raw as { userId: string; online: boolean };
      setChats(prev => prev.map(c => ({
        ...c,
        participants: c.participants.map(p => p.id === userId ? { ...p, online } : p),
      })));
    }, []),

    onMessageStatus: useCallback((raw: unknown) => {
      const { messageId, chatId, status } = raw as { messageId: string; chatId: string; status: string };
      setMessages(prev => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map(m => m.id === messageId ? { ...m, status: status as Message["status"] } : m),
      }));
    }, []),
  });

  const login = async (email: string, password: string) => {
    try {
      const res = await authService.login(email, password);
      setCurrentUser(res.user);
      setPage("app");
      return true;
    } catch { return false; }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const res = await authService.register(email, password, displayName);
      setCurrentUser(res.user);
      setPage("app");
      return true;
    } catch { return false; }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setChats([]);
    setMessages({});
    setActiveChatState(null);
    setPage("landing");
    getSocket()?.disconnect();
  };

  const updateProfile = async (data: Partial<User>) => {
    const updated = await userService.updateProfile(data);
    setCurrentUser(updated);
  };

  const setActiveChat = useCallback(async (chat: Chat | null) => {
    setActiveChatState(chat);
    if (chat && !messages[chat.id]) {
      const msgs = await chatService.getMessages(chat.id);
      setMessages(prev => ({ ...prev, [chat.id]: msgs }));
    }
  }, [messages]);

  const sendMessage = useCallback((chatId: string, text: string, replyToId?: string) => {
    const optimistic: Message = {
      id: `opt_${Date.now()}`,
      chatId, senderId: currentUser!.id, text, mediaUrl: null, mediaType: null,
      status: "sending", replyToId: replyToId || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setMessages(prev => ({ ...prev, [chatId]: [...(prev[chatId] || []), optimistic] }));
    chatService.sendMessage(chatId, text, replyToId).catch(console.error);
  }, [currentUser]);

  const sendMedia = useCallback(async (chatId: string, file: File) => {
    await chatService.uploadMedia(chatId, file);
  }, []);

  const startChat = useCallback(async (userId: string) => {
    const chat = await chatService.getOrCreateChat(userId);
    setChats(prev => prev.find(c => c.id === chat.id) ? prev : [chat, ...prev]);
    setActiveChatState(chat);
    setAppSection("chats");
    setMobileSidebarOpen(false);
  }, []);

  const markSeen = useCallback((chatId: string) => {
    chatService.markSeen(chatId).catch(console.error);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
  }, []);

  const emitTyping = useCallback((chatId: string, isTyping: boolean) => {
    getSocket()?.emit("typing", { chatId, isTyping });
  }, []);

  const searchById = useCallback(async (appId: string) => {
    return userService.searchByAppId(appId);
  }, []);

  const copyAppId = useCallback(() => {
    if (currentUser) {
      navigator.clipboard?.writeText(currentUser.appId).catch(() => {});
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  }, [currentUser]);

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
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
