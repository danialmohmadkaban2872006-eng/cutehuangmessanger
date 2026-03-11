// © Danial Mohmad — All Rights Reserved
// Shared Socket.IO instance so REST controllers can emit events
import { Server } from "socket.io";

let _io: Server | null = null;

// userId → socketId map — shared across socket handler and controllers
export const onlineUsers = new Map<string, string>();

export function setIo(io: Server): void {
  _io = io;
}

export function getIo(): Server | null {
  return _io;
}
