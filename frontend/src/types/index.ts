// © Danial Mohmad — All Rights Reserved

export interface User {
  id: string;
  appId: string;
  email: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  online: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string | null;
  mediaUrl: string | null;
  mediaType: "image" | "video" | "audio" | "file" | null;
  status: "sending" | "sent" | "delivered" | "seen" | "failed";
  replyToId: string | null;
  replyTo?: Pick<Message, "id" | "text" | "senderId" | "createdAt"> | null;
  createdAt: string;
  updatedAt: string;
  sender?: User;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage: Message | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CallState {
  type: "voice" | "video";
  partner: User;
  direction: "outgoing" | "incoming";
}

export type Language = "en" | "zh" | "ar" | "ku" | "bn";

export interface AppContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;

  page: "landing" | "auth" | "app";
  setPage: (p: "landing" | "auth" | "app") => void;
  appSection: "chats" | "calls" | "profile" | "settings";
  setAppSection: (s: "chats" | "calls" | "profile" | "settings") => void;

  chats: Chat[];
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => Promise<void>;
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, text: string, replyToId?: string) => Promise<void>;
  sendMedia: (chatId: string, file: File) => Promise<void>;
  startChat: (userId: string) => Promise<void>;
  markSeen: (chatId: string) => void;
  typingUsers: Record<string, string[]>;
  emitTyping: (chatId: string, isTyping: boolean) => void;

  lang: Language;
  setLang: (l: Language) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  t: Record<string, string>;
  theme: ThemeColors;
  isRTL: boolean;

  callState: CallState | null;
  setCallState: (s: CallState | null) => void;

  searchById: (appId: string) => Promise<User | null>;
  copiedId: boolean;
  copyAppId: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
}

export interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
}
