import { useState } from "react";
import type { IDocumentCommentResponse } from "@/api/api";
import avatar from "@/assets/images/avatar.png";
import type { FloatPosition } from "../types";

interface CommentAnchorProps {
  position: FloatPosition;
  comment: IDocumentCommentResponse;
  onClick: (comment: IDocumentCommentResponse) => void;
}

const truncateText = (text: string, maxLength = 140) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

export function CommentAnchor({ position, comment, onClick }: CommentAnchorProps) {
  const [hovered, setHovered] = useState(false);
  const author = comment.createdBy as unknown;
  const authorName =
    author && typeof author === "object" && "fullName" in author
      ? String((author as { fullName?: string }).fullName || "User")
      : String(author || "User");

  return (
    <div
      style={{
        position: "absolute",
        top: position.top - 30,
        left: position.left - 5,
        zIndex: 40,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label="Document comment"
        className="rounded-full bg-white p-1 border border-[#E5E5E5] shadow-sm cursor-pointer"
        onClick={(event) => {
          event.stopPropagation();
          onClick(comment);
        }}
      >
        <img
          src={avatar}
          alt={`${authorName} avatar`}
          className="w-8 h-8 rounded-full object-cover"
        />
      </button>

      {hovered && (
        <div
          className="absolute left-16 top-0 bg-white border border-[#E5E5E5] shadow-lg"
          style={{
            borderRadius: "var(--border-radius-rounded-3xl, 24px)",
            padding: "6px",
            gap: 12,
            minWidth: 296,
            zIndex: 40,
          }}
        >
          <div
            className="bg-white rounded-lg"
            style={{
              width: 296,
              padding: "8px",
              gap: 8,
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <img
              src={avatar}
              alt="User avatar"
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />

            <div className="flex flex-col min-w-0 flex-1" style={{ gap: 4 }}>
              <div className="flex flex-col" style={{ gap: 2 }}>
                <p className="flex gap-1.5 text-sm font-semibold leading-5 text-foreground">
                  {authorName}
                  <span className="font-normal text-muted-foreground">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </p>
                <p className="text-sm font-normal leading-normal text-foreground">
                  {truncateText(comment.text)}
                </p>
              </div>

              <span className="text-sm font-normal leading-normal text-muted-foreground">
                {comment.replyCount
                  ? `${comment.replyCount} ${Number(comment.replyCount) === 1 ? "reply" : "replies"}`
                  : "No replies"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
