import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  authApi,
  commentApi,
  type ICommentCreator,
  type ICommentReplyResponse,
  type IDocumentCommentResponse,
} from "@/api/api";
import avatar from "@/assets/images/avatar.png";
import { CommentActionsMenu } from "./CommentActionsMenu";
import { DeleteCommentDialog } from "./DeleteCommentDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RightCommentPanelProps {
  comment: IDocumentCommentResponse;
  onReplyCreated?: (commentId: string) => void;
  onReplyDeleted?: (commentId: string) => void;
  onCommentUpdated?: (comment: IDocumentCommentResponse) => void;
  onCommentDeleted?: (commentId: string) => void;
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

type CommentBodyKind = "comment" | "reply";

interface EditingTarget {
  kind: CommentBodyKind;
  id: string;
}

interface CurrentUserInfo {
  id?: string;
}

const getEditingKey = (target: EditingTarget) => `${target.kind}:${target.id}`;

const shouldShowCommentMenu = (ownerId: string | null, currentUserId: string | null) => {
  return Boolean(currentUserId && ownerId && ownerId === currentUserId);
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

const formatTooltipDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
};

function CommentTimestampTooltipContent({
  createdAt,
  updatedAt,
  isUpdated,
}: {
  createdAt: string;
  updatedAt?: string;
  isUpdated?: boolean;
}) {
  if (!isUpdated) {
    return <>Created: {formatTooltipDateTime(createdAt)}</>;
  }

  return (
    <ul className="pl-8 -ml-3 space-y-0 list-disc">
      <li>Created: {formatTooltipDateTime(createdAt)}</li>
      <li>Last Edited: {formatTooltipDateTime(updatedAt ?? createdAt)}</li>
    </ul>
  );
};

function CommentEditBox({
  value,
  originalValue,
  onChange,
  onSave,
  onCancel,
  isSaving,
}: {
  value: string;
  originalValue: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasChanged = value.trim() !== originalValue.trim();
  const canSave = value.trim().length > 0 && hasChanged && !isSaving;

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  return (
    <div
      className="flex items-center flex-1 min-w-0 rounded-lg border border-[#E5E5E5] bg-white pr-1 transition-shadow focus-within:border-(--base-ring,#A3A3A3) focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }

          if (event.key === "Enter") {
            event.preventDefault();
            onSave();
          }
        }}
        className="px-2.5 py-1 flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        disabled={isSaving}
      />

      <button
        type="button"
        onClick={onSave}
        disabled={!canSave}
        className="p-1.5 rounded-md bg-[#171717] disabled:bg-[#E5E5E5] flex items-center justify-center shrink-0 transition-colors"
      >
        {isSaving
          ? <Loader2 size={12} className="text-white animate-spin" />
          : <ArrowUp size={12} weight="bold" className="text-white" />
        }
      </button>
    </div>
  );
}

function CommentBody({
  author,
  createdAt,
  updatedAt,
  text,
  showMenu,
  showCreatedAtTooltip,
  onEdit,
  onDelete,
  isEditing,
  editValue,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  isSavingEdit,
  isDeleting,
  isUpdated,
}: {
  author: ICommentCreator;
  createdAt: string;
  updatedAt?: string;
  text: string;
  showMenu?: boolean;
  showCreatedAtTooltip?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  editValue?: string;
  onEditValueChange?: (value: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  isSavingEdit?: boolean;
  isDeleting?: boolean;
  isUpdated: boolean;
}) {
  const shouldShowTooltip = Boolean(showCreatedAtTooltip || isUpdated);
  const relativeTime = (
    <>
      {formatRelativeTime(createdAt)}
      {isUpdated && " (Edited)"}
    </>
  );
  const timestampLabel = (
    <span className="text-xs font-normal leading-normal text-muted-foreground whitespace-nowrap">
      {relativeTime}
    </span>
  );

  return (
    <div className="flex items-start gap-2 w-full">
      <img
        src={avatar}
        alt={`${author.fullName} avatar`}
        className="w-7 h-7 rounded-full object-cover shrink-0"
      />

      {isEditing && editValue !== undefined && onEditValueChange && onSaveEdit && onCancelEdit ? (
        <CommentEditBox
          value={editValue}
          originalValue={text}
          onChange={onEditValueChange}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          isSaving={Boolean(isSavingEdit)}
        />
      ) : (
        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm font-semibold leading-5 text-foreground truncate">
              {author.fullName}
            </p>

            {shouldShowTooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  {timestampLabel}
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="center"
                  sideOffset={10}
                  className="max-w-sm whitespace-nowrap rounded-md py-1.5 px-3 bg-[#171717] text-xs font-normal leading-normal text-white shadow-lg [&_svg]:bg-[#171717] [&_svg]:fill-[#171717]"
                >
                  <CommentTimestampTooltipContent
                    createdAt={createdAt}
                    updatedAt={updatedAt}
                    isUpdated={isUpdated}
                  />
                </TooltipContent>
              </Tooltip>
            ) : timestampLabel}


            {showMenu && onEdit && onDelete && (
              <CommentActionsMenu
                onEdit={onEdit}
                onDelete={onDelete}
                disabled={isSavingEdit || isDeleting}
              />
            )}
          </div>

          <p className="text-sm font-normal leading-normal text-foreground wrap-break-word">
            {text}
          </p>
        </div>
      )}
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

export function ThreadCommentModal({
  comment,
  onReplyCreated,
  onCommentUpdated,
  onCommentDeleted,
}: RightCommentPanelProps) {
  const [replies, setReplies] = useState<ICommentReplyResponse[]>([]);
  const [replyDraft, setReplyDraft] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleteCommentDialogOpen, setIsDeleteCommentDialogOpen] = useState(false);
  const [deletingTargetKey, setDeletingTargetKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      try {
        const res = await authApi.getInfo();
        const user = res.data as CurrentUserInfo;
        if (isMounted) {
          setCurrentUserId(user.id ?? null);
        }
      } catch (error) {
        console.warn("Failed to load current user:", error);
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadReplies = async () => {
      setEditingTarget(null);
      setEditDraft("");
      setDeletingTargetKey(null);
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

  const startEditing = (target: EditingTarget, text: string) => {
    setEditingTarget(target);
    setEditDraft(text);
  };

  const cancelEditing = () => {
    setEditingTarget(null);
    setEditDraft("");
  };

  const isEditing = (target: EditingTarget) => {
    return editingTarget ? getEditingKey(editingTarget) === getEditingKey(target) : false;
  };

  const isDeleting = (target: EditingTarget) => {
    return deletingTargetKey === getEditingKey(target);
  };

  const handleSaveEdit = async () => {
    if (!editingTarget || isSavingEdit) return;

    const draft = editDraft.trim();
    if (!draft) return;

    setIsSavingEdit(true);
    try {
      if (editingTarget.kind === "comment") {
        const res = await commentApi.update(editingTarget.id, { text: draft });
        onCommentUpdated?.(res.data);
      } else {
        const res = await commentApi.updateReply(comment._id, editingTarget.id, { text: draft });
        setReplies((prev) => prev.map((reply) => (
          reply._id === editingTarget.id ? res.data : reply
        )));
      }

      cancelEditing();
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast.error("Failed to update comment.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (target: EditingTarget) => {
    const targetKey = getEditingKey(target);
    if (deletingTargetKey) return;

    setDeletingTargetKey(targetKey);
    try {
      if (target.kind === "comment") {
        await commentApi.delete(target.id);
        onCommentDeleted?.(target.id);
        setIsDeleteCommentDialogOpen(false);
      } else {
        await commentApi.deleteReply(comment._id, target.id);
        setReplies((prev) => 
          prev.map((reply) => (
            reply._id === target.id ? {...reply, isDeleted: true} : {...reply} 
          ))
        );
      }

      if (editingTarget && getEditingKey(editingTarget) === targetKey) {
        cancelEditing();
      }

    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment.");
    } finally {
      setDeletingTargetKey(null);
    }
  };

  const handleDeleteRequest = (target: EditingTarget) => {
    if (target.kind === "comment") {
      setIsDeleteCommentDialogOpen(true);
      return;
    }

    handleDelete(target);
  };

  const spineStyle: CSSProperties = {
    left: THREAD_ROOT_AVATAR_CENTER_X,
    top: THREAD_ROOT_AVATAR_BOTTOM_Y,
    bottom: THREAD_SPINE_BOTTOM_OFFSET,
    backgroundColor: THREAD_LINE_COLOR,
  };
  const rootTarget: EditingTarget = { kind: "comment", id: comment._id };

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
            author={comment.owner}
            createdAt={comment.created_at}
            updatedAt={comment.updated_at}
            isUpdated={comment.isUpdated}
            text={comment.text}
            showCreatedAtTooltip
            showMenu={shouldShowCommentMenu(comment.owner.id, currentUserId)}
            onEdit={() => startEditing(rootTarget, comment.text)}
            onDelete={() => handleDeleteRequest(rootTarget)}
            isEditing={isEditing(rootTarget)}
            editValue={editDraft}
            onEditValueChange={setEditDraft}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={cancelEditing}
            isSavingEdit={isSavingEdit && isEditing(rootTarget)}
            isDeleting={isDeleting(rootTarget)}
          />
        </div>

        <div className="relative z-10 w-full flex flex-col gap-4 pt-2 pr-4 pb-4 pl-12">
          {isLoadingReplies ? (
            <div className="relative z-10 flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 size={14} className="animate-spin" />
              Loading replies...
            </div>
          ) : (
            replies.map((reply) => {
              const replyTarget: EditingTarget = { kind: "reply", id: reply._id };

              return (
                <ThreadBranchItem key={reply._id}>
                  {reply.isDeleted ? (
                    <div className="mt-1 pb-2">
                      <p className="text-sm font-normal italic leading-5 text-muted-foreground">
                        This comment has been deleted.
                      </p>
                    </div>
                  ) : (
                    <CommentBody
                      author={reply.owner}
                      isUpdated={reply.isUpdated}
                      createdAt={reply.created_at}
                      updatedAt={reply.updated_at}
                      text={reply.text}
                      showMenu={shouldShowCommentMenu(reply.owner.id, currentUserId)}
                      onEdit={() => startEditing(replyTarget, reply.text)}
                      onDelete={() => handleDeleteRequest(replyTarget)}
                      isEditing={isEditing(replyTarget)}
                      editValue={editDraft}
                      onEditValueChange={setEditDraft}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={cancelEditing}
                      isSavingEdit={isSavingEdit && isEditing(replyTarget)}
                      isDeleting={isDeleting(replyTarget)}
                    />
                  )}
                </ThreadBranchItem>
              );
            })
          )}

          <ThreadBranchItem joinY={THREAD_REPLY_INPUT_JOIN_Y}>
            <div className="flex items-center gap-2 w-full">
              <img
                src={avatar}
                alt="Reply avatar"
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />

              <div
                className="flex items-center flex-1 min-w-0 rounded-lg border border-[#E5E5E5] bg-white pr-1 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
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
                  className="px-2.5 py-1 flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground  rounded-lg"
                  disabled={isSubmittingReply}
                />

                <button
                  type="button"
                  onClick={handleSubmitReply}
                  disabled={!replyDraft.trim() || isSubmittingReply}
                  className="p-1.5 rounded-md bg-[#171717] disabled:bg-[#E5E5E5] flex items-center justify-center shrink-0 transition-colors"
                >
                  {isSubmittingReply
                    ? <Loader2 size={12} className="text-white animate-spin" />
                    : <ArrowUp size={12} weight="bold" className="text-white" />
                  }
                </button>
              </div>
            </div>
          </ThreadBranchItem>
        </div>
      </div>

      <DeleteCommentDialog
        open={isDeleteCommentDialogOpen}
        isDeleting={isDeleting(rootTarget)}
        onOpenChange={setIsDeleteCommentDialogOpen}
        onDelete={() => handleDelete(rootTarget)}
      />
    </TooltipProvider>
  );
}
