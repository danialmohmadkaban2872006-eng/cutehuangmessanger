// © Danial Mohmad — All Rights Reserved
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

export function useSocket(
  token: string | null,
  handlers: {
    onMessage: (msg: unknown) => void;
    onTyping: (event: unknown) => void;
    onPresence: (event: unknown) => void;
    onMessageStatus: (event: unknown) => void;
  }
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        auth: { token },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket"],
      });
    }

    const socket = socketInstance;

    const onMessage = (data: unknown) => handlersRef.current.onMessage(data);
    const onTyping = (data: unknown) => handlersRef.current.onTyping(data);
    const onPresence = (data: unknown) => handlersRef.current.onPresence(data);
    const onMsgStatus = (data: unknown) => handlersRef.current.onMessageStatus(data);

    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);
    socket.on("presence", onPresence);
    socket.on("message:status", onMsgStatus);

    return () => {
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
      socket.off("presence", onPresence);
      socket.off("message:status", onMsgStatus);
    };
  }, [token]);
}
