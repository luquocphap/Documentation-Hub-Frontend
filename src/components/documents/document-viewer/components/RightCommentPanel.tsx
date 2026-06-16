import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  commentApi,
  type ICommentCreator,
  type ICommentReplyResponse,
  type IDocumentCommentResponse,
} from "@/api/api";
import avatar from "@/assets/images/avatar.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RightCommentPanelProps {
  comment: IDocumentCommentResponse;
  onReplyCreated?: (commentId: string) => void;
}

const THREAD_ROOT_AVATAR_CENTER_X = 30;
const THREAD_ROOT_AVATAR_BOTTOM_Y = 50;
const THREAD_REPLY_CONTENT_LEFT_X = 48;
const THREAD_BRANCH_WIDTH = 14;
const THREAD_SPINE_BOTTOM_OFFSET = 42;
const THREAD_LINE_COLOR = "#D4D4D4";

const THREAD_BRANCH_RADIUS = 8;
const THREAD_REPLY_JOIN_Y = 14;
const THREAD_REPLY_INPUT_JOIN_Y = 20;

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const formatCreatedAtTooltip = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Created: Unknown date";

  return `Created: ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date)}`;
};

function CommentBody({
  author,
  createdAt,
  text,
  showMenu,
  showCreatedAtTooltip,
}: {
  author: ICommentCreator;
  createdAt: string;
  text: string;
  showMenu?: boolean;
  showCreatedAtTooltip?: boolean;
}) {
  const relativeTime = (
    <span className="text-sm font-normal leading-5 text-muted-foreground whitespace-nowrap">
      {formatRelativeTime(createdAt)}
    </span>
  );

  return (
    <div className="flex items-start gap-2 w-full">
      <img
        src={avatar}
        alt={`${author.fullName} avatar`}
        className="w-7 h-7 rounded-full object-cover shrink-0"
      />

      <div className="flex flex-col min-w-0 flex-1 gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-semibold leading-5 text-foreground truncate">
            {author.fullName}
          </p>

          {showCreatedAtTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {relativeTime}
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                sideOffset={10}
                className="max-w-sm whitespace-nowrap rounded-md py-1.5 px-3 bg-[#171717] text-xs font-normal leading-normal text-white shadow-lg [&_svg]:bg-[#171717] [&_svg]:fill-[#171717]"
              >
                {formatCreatedAtTooltip(createdAt)}
              </TooltipContent>
            </Tooltip>
          ) : relativeTime}

          {showMenu && (
            <button
              type="button"
              aria-label="Comment options"
              className="ml-auto w-7 h-7 rounded-md flex items-center justify-center hover:bg-secondary"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>

        <p className="text-sm font-normal leading-normal text-foreground wrap-break-word">
          {text}
        </p>
      </div>
    </div>
  );
}

function ThreadBranchItem({
  children,
  joinY = THREAD_REPLY_JOIN_Y,
}: {
  children: ReactNode;
  joinY?: number;
}) {
  const branchElbowStyle: CSSProperties = {
    left: THREAD_ROOT_AVATAR_CENTER_X - THREAD_REPLY_CONTENT_LEFT_X,
    top: 0,
    width: THREAD_BRANCH_WIDTH,
    height: joinY,
    borderLeft: `1px solid ${THREAD_LINE_COLOR}`,
    borderBottom: `1px solid ${THREAD_LINE_COLOR}`,
    borderBottomLeftRadius: THREAD_BRANCH_RADIUS,
  };

  return (
    <div className="relative w-full">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-0 box-border"
        style={branchElbowStyle}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function RightCommentPanel({ comment, onReplyCreated }: RightCommentPanelProps) {
  const [replies, setReplies] = useState<ICommentReplyResponse[]>([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadReplies = async () => {
      setIsLoadingReplies(true);
      try {
        const res = await commentApi.getReplies(comment._id);
        if (isMounted) {
          setReplies(res.data);
        }
      } catch (error) {
        console.warn("Failed to load comment replies:", error);
        toast.error("Failed to load replies.");
      } finally {
        if (isMounted) {
          setIsLoadingReplies(false);
        }
      }
    };

    loadReplies();

    return () => {
      isMounted = false;
    };
  }, [comment._id]);

  const handleSubmitReply = async () => {
    const draft = replyDraft.trim();
    if (!draft || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      const res = await commentApi.createReply(comment._id, { text: draft });
      setReplies((prev) => [...prev, res.data]);
      setReplyDraft("");
      onReplyCreated?.(comment._id);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (error) {
      console.error("Failed to create comment reply:", error);
      toast.error("Failed to add reply.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const spineStyle: CSSProperties = {
    left: THREAD_ROOT_AVATAR_CENTER_X,
    top: THREAD_ROOT_AVATAR_BOTTOM_Y,
    bottom: THREAD_SPINE_BOTTOM_OFFSET,
    backgroundColor: THREAD_LINE_COLOR,
  };

  return (
    <TooltipProvider>
      <div
        className="absolute top-30 right-5 z-50 w-87.5 rounded-lg border border-[#E5E5E5] bg-white shadow-lg overflow-hidden"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-0 w-px"
          style={spineStyle}
        />

        <div className="relative z-10 w-full flex flex-col gap-1 pt-4 pr-4 pb-2 pl-4">
          <CommentBody
            author={comment.createdBy}
            createdAt={comment.created_at}
            text={comment.text}
            showMenu
            showCreatedAtTooltip
          />
        </div>

        <div className="relative z-10 w-full flex flex-col gap-4 pt-2 pr-4 pb-4 pl-12">
          {isLoadingReplies ? (
            <div className="relative z-10 flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 size={14} className="animate-spin" />
              Loading replies...
            </div>
          ) : (
            replies.map((reply) => (
              <ThreadBranchItem key={reply._id}>
                <CommentBody
                  author={reply.createdBy}
                  createdAt={reply.created_at}
                  text={reply.text}
                />
              </ThreadBranchItem>
            ))
          )}

          <ThreadBranchItem joinY={THREAD_REPLY_INPUT_JOIN_Y}>
            <div className="flex items-center gap-2 w-full">
              <img
                src={avatar}
                alt="Reply avatar"
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />

              <div
                className="flex items-center flex-1 min-w-0 rounded-lg border border-[#E5E5E5] bg-white pr-1"
                style={{ boxShadow: "0px 0px 0px 3px var(--customoutline)" }}
              >
                <input
                  ref={inputRef}
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmitReply();
                    }
                  }}
                  placeholder="Reply..."
                  className="h-10 flex-1 min-w-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                  disabled={isSubmittingReply}
                />

                <button
                  type="button"
                  onClick={handleSubmitReply}
                  disabled={!replyDraft.trim() || isSubmittingReply}
                  className="w-8 h-8 rounded-md bg-[#171717] disabled:bg-[#E5E5E5] flex items-center justify-center shrink-0 transition-colors"
                >
                  {isSubmittingReply
                    ? <Loader2 size={14} className="text-white animate-spin" />
                    : <ArrowUp size={14} weight="bold" className="text-white" />
                  }
                </button>
              </div>
            </div>
          </ThreadBranchItem>
        </div>
      </div>
    </TooltipProvider>
  );
}
