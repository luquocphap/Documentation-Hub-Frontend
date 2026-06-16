import { X } from "lucide-react";
import type { IDocumentCommentResponse } from "@/api/api";
import avatar from "@/assets/images/avatar.png";

interface CommentPanelProps {
  comments: IDocumentCommentResponse[];
  onClose: () => void;
  onSelectComment: (comment: IDocumentCommentResponse) => void;
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

const getAuthorName = (comment: IDocumentCommentResponse) => {
  return comment.owner?.fullName || "Unknown user";
};

function CommentPanelItem({
  comment,
  onClick,
}: {
  comment: IDocumentCommentResponse;
  onClick: () => void;
}) {
  const authorName = getAuthorName(comment);

  return (
    <button
      type="button"
      className="w-full rounded-lg bg-white p-2 text-left transition-colors hover:bg-secondary"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <img
          src={avatar}
          alt={`${authorName} avatar`}
          className="w-7 h-7 rounded-full object-cover shrink-0"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-semibold leading-5 text-foreground">
              {authorName}
            </p>
            <span className="shrink-0 text-xs font-normal leading-normal text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>

          <p className="text-sm font-normal leading-normal text-foreground wrap-break-word">
            {truncateText(comment.text)}
          </p>

          <span className="text-sm font-normal leading-normal text-muted-foreground">
            {comment.replyCount
              ? `${comment.replyCount} ${Number(comment.replyCount) === 1 ? "reply" : "replies"}`
              : "No replies"}
          </span>
        </div>
      </div>
    </button>
  );
}

export function CommentPanel({
  comments,
  onClose,
  onSelectComment,
}: CommentPanelProps) {
  return (
    <div className="fixed top-33 right-0 z-50 flex h-145 w-96 flex-col rounded-l-none rounded-r-lg border border-[#E5E5E5] bg-white shadow-lg">
      <div className="flex h-15.75 w-full shrink-0 items-center justify-between gap-0.5 border-b border-[#E5E5E5] p-4">
        <h2 className="text-sm font-medium leading-5 text-foreground">Comments</h2>
        <button
          type="button"
          aria-label="Close comments"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <div className="h-full w-full min-h-0 overflow-y-auto pt-2 pr-2 pl-2">
        {comments.length > 0 ? (
          <div className="flex flex-col gap-1">
            {comments.map((comment) => (
              <CommentPanelItem
                key={comment._id}
                comment={comment}
                onClick={() => onSelectComment(comment)}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
            No comments yet.
          </div>
        )}
      </div>
    </div>
  );
}
