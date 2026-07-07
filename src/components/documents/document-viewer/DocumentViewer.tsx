import { useEffect, useRef } from "react";
import { Loader2, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddCommentButton } from "./components/AddCommentButton";
import { CommentAnchor } from "./components/CommentAnchor";
import { CommentInputBox } from "./components/CommentInputBox";
import { CommentPanel } from "./components/CommentPanel";
import { DiscardDialog } from "./components/DiscardDialog";
import { PageNavigationBar } from "./components/PageNavigationBar";
import { ThreadCommentModal } from "./components/ThreadCommentModal";
import { useApryseViewer } from "./hooks/useApryseViewer";
import { useDocumentComments } from "./hooks/useDocumentComments";
import { useDocumentEdit } from "./hooks/useDocumentEdit";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import type { DocumentViewerProps } from "./types";

type DocumentCommentsState = ReturnType<typeof useDocumentComments>;

export function DocumentViewer({
  documentId,
  publicId,
  initialTitle,
  canComment,
  onViewerInit,
  onTitleUpdate,
  onSaveSuccess,
}: DocumentViewerProps) {
  const commentsStateRef = useRef<DocumentCommentsState | null>(null);

  const viewer = useApryseViewer({
    publicId,
    showCommentAnnotations: canComment,
    onDocumentLoaded: () => {
      const commentsState = commentsStateRef.current;
      if (!commentsState) return;

      commentsState.resetForDocumentLoad();

      if (canComment) {
        void commentsState.loadComments().finally(() => {
          commentsState.scheduleAnchorRecalculation();
        });
      }
    },
    onTextSelected: (quads, text, pageNumber) => {
      commentsStateRef.current?.handleTextSelected(quads, text, pageNumber);
    },
    onLayoutUpdated: () => {
      commentsStateRef.current?.scheduleAnchorRecalculation();
    },
    onCommentAnnotationSelected: () => {
      commentsStateRef.current?.closeFloatingUI();
    },
  });

  const title = useDocumentTitle({
    documentId,
    initialTitle,
    onTitleUpdate,
  });

  const edit = useDocumentEdit({
    documentId,
    title: title.value,
    docViewerRef: viewer.docViewerRef,
    setDefaultTool: viewer.setDefaultTool,
    reloadDocument: viewer.reloadDocument,
    closeCommentUI: () => {
      commentsStateRef.current?.closeFloatingUI();
    },
    closeCommentPanel: () => {
      commentsStateRef.current?.setIsCommentPanelOpen(false);
    },
    onSaveSuccess,
  });

  const comments = useDocumentComments({
    documentId,
    canComment,
    currentPage: viewer.currentPage,
    docViewerRef: viewer.docViewerRef,
    scrollViewRef: viewer.scrollViewRef,
    viewerRef: viewer.viewerRef,
    isContentEditActive: edit.isContentEditActive,
    setDefaultTool: viewer.setDefaultTool,
  });

  useEffect(() => {
    commentsStateRef.current = comments;
  }, [comments]);

  useEffect(() => {
    if (!onViewerInit) return;

    onViewerInit({
      startContentEdit: edit.startContentEdit,
      endContentEdit: edit.endContentEdit,
      isContentEditActive: edit.isContentEditActive,
      openCommentPanel: comments.openCommentPanel,
    });
  }, [
    comments.openCommentPanel,
    edit.endContentEdit,
    edit.isContentEditActive,
    edit.startContentEdit,
    onViewerInit,
  ]);

  const isSaving = title.isSaving || edit.isSaving;

  return (
    <div className="flex-1 w-full flex flex-col rounded-xl overflow-hidden border border-[#E5E5E5] bg-white shadow-sm min-h-0">
      {/* TITLE BAR */}
      <div className="h-16 py-2 pl-3 pr-4 shrink-0 flex items-center border-b border-[#E5E5E5]">
        <TooltipProvider>
          {title.isEditing ? (
            <>
              <span
                ref={title.measureRef}
                className="text-lg font-medium invisible absolute whitespace-pre py-1 px-2.5"
                aria-hidden
              >
                {title.value}
              </span>
              <Tooltip open={title.isTooLong}>
                <TooltipTrigger asChild>
                  <input
                    ref={title.inputRef}
                    autoFocus
                    value={title.value}
                    aria-invalid={title.isTooLong}
                    onChange={(event) => title.setValue(event.target.value)}
                    onBlur={() => {
                      if (!title.isTooLong) title.setIsEditing(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void title.rename();
                      }

                      if (event.key === "Escape") {
                        title.reset();
                      }
                    }}
                    style={{ width: title.inputWidth || "auto" }}
                    className={`text-lg py-1 px-2.5 font-medium text-foreground border rounded-lg outline-none transition-shadow ${
                      title.isTooLong
                        ? "border-destructive ring-2 ring-destructive/30 shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
                        : "focus:ring-2 focus:ring-ring/30"
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="center"
                  sideOffset={10}
                  className="max-w-sm whitespace-nowrap rounded-md py-1.5 px-3 bg-[#171717] text-xs font-normal leading-normal text-white shadow-lg [&_svg]:bg-[#171717] [&_svg]:fill-[#171717]"
                >
                  Document name must be 255 characters or fewer
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <button
              onClick={title.startEditing}
              className="flex items-center gap-1.5"
            >
              <span className="text-lg font-medium text-foreground truncate flex-1">
                {title.value}
              </span>
              {isSaving ? (
                <Loader2
                  size={16}
                  className="text-muted-foreground shrink-0 animate-spin"
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex shrink-0">
                      <PencilLine
                        size={16}
                        className="text-muted-foreground"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="center"
                    sideOffset={10}
                    className="rounded-md py-1.5 px-3 bg-[#171717] text-xs font-normal leading-normal text-white shadow-lg [&_svg]:bg-[#171717] [&_svg]:fill-[#171717]"
                  >
                    Rename
                  </TooltipContent>
                </Tooltip>
              )}
            </button>
          )}
        </TooltipProvider>

        {edit.isContentEditMode && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => edit.setIsDiscardDialogOpen(true)}
            >
              Discard changes
            </Button>
            <Button
              type="button"
              className="text-sm font-normal"
              disabled={isSaving}
              onClick={() => {
                void edit.saveDocument();
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" />{" "}
                  Saving...
                </>
              ) : (
                "Done"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* APRYSE CORE VIEWER */}
      <div className="flex-1 min-h-0 bg-[#f3f4f6] relative">
        <div className="h-full min-w-0 min-h-0">
          <div
            ref={viewer.scrollViewRef}
            style={{
              height: "100%",
              width: "100%",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#f3f4f6",
              position: "relative",
            }}
          >
            {viewer.isLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.7)",
                }}
              >
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-500">
                  Loading document...
                </span>
              </div>
            )}

            <div
              ref={viewer.viewerRef}
              style={{ margin: "auto", width: "580px" }}
            />

            {canComment && comments.addBtnPos && !comments.inputBoxPos && (
              <AddCommentButton
                position={comments.addBtnPos}
                onClick={() =>
                  comments.openCommentInput(
                    comments.addBtnPos ?? undefined,
                    false,
                    comments.commentSelectionSnapshotRef.current
                  )
                }
              />
            )}

            {canComment && comments.inputBoxPos && (
              <CommentInputBox
                position={comments.inputBoxPos}
                value={comments.commentDraft}
                onChange={comments.setCommentDraft}
                onSubmit={comments.handleSubmitComment}
                onClose={comments.closeFloatingUI}
                isSubmitting={comments.isSubmittingComment}
              />
            )}

            {canComment &&
              comments.comments.map((comment) => {
                if (comment._id === comments.activeCommentId) return null;

                const position = comments.anchorPositions[comment._id];
                if (!position) return null;

                return (
                  <CommentAnchor
                    key={comment._id}
                    position={position}
                    comment={comment}
                    onClick={comments.handleAnchorCommentClick}
                  />
                );
              })}
          </div>
        </div>

        {canComment && comments.activeComment && (
          <ThreadCommentModal
            key={comments.activeComment._id}
            comment={comments.activeComment}
            placement={comments.activeCommentSource}
            onClose={() => comments.setActiveCommentId(null)}
            onCommentUpdated={comments.handleCommentUpdated}
            onCommentDeleted={comments.handleCommentDeleted}
          />
        )}

        {canComment && comments.isCommentPanelOpen && (
          <CommentPanel
            comments={comments.comments}
            onClose={() => comments.setIsCommentPanelOpen(false)}
            onSelectComment={comments.handlePanelCommentClick}
          />
        )}
      </div>

      <PageNavigationBar
        currentPage={viewer.currentPage}
        totalPages={viewer.totalPages}
        isLoading={viewer.isLoading}
        onPageChange={viewer.goToPage}
      />

      <DiscardDialog
        open={edit.isDiscardDialogOpen}
        isDiscarding={edit.isDiscarding}
        onOpenChange={edit.setIsDiscardDialogOpen}
        onDiscard={() => {
          void edit.discardChanges();
        }}
      />
    </div>
  );
}
