import type { ActivityLogCreatedPayload } from "@/api/api";
import { BACKEND_URL } from "@/lib/constant";
import { io, type Socket } from "socket.io-client";

export const SOCKET_EVENTS = {
  JOIN_WORKSPACE: "workspace:join",
  LEAVE_WORKSPACE: "workspace:leave",
  ACTIVITY_CREATED: "activity_log:created",

  JOIN_DOCUMENT: "document:join",
  LEAVE_DOCUMENT: "document:leave",
  COMMENT_CREATED: "comment:created",
  COMMENT_UPDATED: "comment:updated",
  COMMENT_DELETED: "comment:deleted",
  REPLY_CREATED_SUMMARY: "reply:created_summary",
} as const;

export interface WorkspaceRoomPayload {
  workspaceId: string;
}

export interface DocumentRoomPayload {
  documentId: string;
}

export interface SocketAck {
  success: boolean;
  workspaceId?: string;
  documentId?: string;
  error?: string;
}

export type DocumentCommentStatus = "OPEN" | "RESOLVED";

export interface RealtimeCommentOwner {
  id: string;
  fullName: string;
}

export interface RealtimeDocumentAnnotation {
  _id: string;
  documentId: string;
  annotationId: string;
  type: string;
  pageNumber: number;
  quads: Record<string, unknown>[];
  rect: Record<string, unknown> | null;
  contents: string;
  color: string;
  opacity: number;
  xfdf: string | null;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCommentRealtimePayload {
  _id: string;
  documentId: string;
  text: string;
  selectedText: string | null;
  pageNumber: number;
  status: DocumentCommentStatus;
  replyCount: number;
  annotationRef: RealtimeDocumentAnnotation | string | null;
  annotationId: string | null;
  owner: RealtimeCommentOwner;
  created_at: string;
  updated_at: string;
  isUpdated: boolean;
}

export interface CommentDeletedPayload {
  documentId: string;
  commentId: string;
  annotationId: string | null;
}

export interface ReplyCreatedSummaryPayload {
  documentId: string;
  commentId: string;
  replyCount: number;
}

interface ActivityServerToClientEvents {
  "activity_log:created": (
    activity: ActivityLogCreatedPayload
  ) => void;
}

interface ActivityClientToServerEvents {
  "workspace:join": (
    payload: WorkspaceRoomPayload,
    callback: (response: SocketAck) => void
  ) => void;

  "workspace:leave": (
    payload: WorkspaceRoomPayload,
    callback: (response: SocketAck) => void
  ) => void;
}

export interface DocumentServerToClientEvents {
  "comment:created": (
    comment: DocumentCommentRealtimePayload
  ) => void;

  "comment:updated": (
    comment: DocumentCommentRealtimePayload
  ) => void;

  "comment:deleted": (
    payload: CommentDeletedPayload
  ) => void;

  "reply:created_summary": (
    payload: ReplyCreatedSummaryPayload
  ) => void;
}

export interface DocumentClientToServerEvents {
  "document:join": (
    payload: DocumentRoomPayload,
    callback: (response: SocketAck) => void
  ) => void;

  "document:leave": (
    payload: DocumentRoomPayload,
    callback: (response: SocketAck) => void
  ) => void;
}

export type ActivitySocket = Socket<
  ActivityServerToClientEvents,
  ActivityClientToServerEvents
>;

export type DocumentSocket = Socket<
  DocumentServerToClientEvents,
  DocumentClientToServerEvents
>;

// BACKEND_URL includes the REST prefix (/api), while Socket.IO listens at
// the backend origin.
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

export function createDocumentSocket(): DocumentSocket {
  return io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
  });
}
