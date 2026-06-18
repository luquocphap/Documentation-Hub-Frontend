import { io, type Socket } from "socket.io-client";
import type { ActivityLogCreatedPayload } from "@/api/api";
import { BACKEND_URL } from "@/lib/constant";

export interface SocketAck {
  success: boolean;
  workspaceId?: string;
  error?: string;
}

interface WorkspaceRoomPayload {
  workspaceId: string;
}

interface ServerToClientEvents {
  "activity_log:created": (
    activity: ActivityLogCreatedPayload
  ) => void;
}

interface ClientToServerEvents {
  "workspace:join": (
    payload: WorkspaceRoomPayload,
    callback: (response: SocketAck) => void
  ) => void;

  "workspace:leave": (
    payload: WorkspaceRoomPayload,
    callback: (response: SocketAck) => void
  ) => void;
}

export type ActivitySocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

// BACKEND_URL hiện là http://localhost:3069/api.
// Socket.IO kết nối tới origin http://localhost:3069.
const SOCKET_URL = new URL(
  BACKEND_URL,
  window.location.origin
).origin;

export function createActivitySocket(): ActivitySocket {
  return io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
  });
}