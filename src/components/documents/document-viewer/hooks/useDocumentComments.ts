import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  commentApi,
  type IDocumentAnnotationResponse,
  type IDocumentCommentResponse,
} from "@/api/api";
import {
  createDocumentSocket,
  SOCKET_EVENTS,
  type CommentDeletedPayload,
  type DocumentCommentRealtimePayload,
  type ReplyCreatedSummaryPayload,
} from "@/lib/socket";
import { toast } from "sonner";
import type {
  ApryseDocumentViewer,
  CommentCoordinateMode,
  FloatPosition,
  FloatingPlacement,
  QuadLike,
  SelectedTextInfo,
  ToolModeViewer,
} from "../types";

const COMMENT_FLOAT_COORDINATE_MODE: CommentCoordinateMode = "content";
const COMMENT_FLOAT_FINE_TUNE = { x: -70, y: -170 };
const COMMENT_FLOAT_PLACEMENT_OFFSET: Record<
  FloatingPlacement,
  { x: number; y: number }
> = {
  button: { x: 8, y: -36 },
  input: { x: 190, y: -48 },
  anchor: { x: 5, y: -65 },
};

type AnchorUpdateMode = "replace" | "merge";

interface UseDocumentCommentsOptions {
  documentId: string;
  canComment: boolean;
  currentPage: number;
  docViewerRef: RefObject<ApryseDocumentViewer | null>;
  scrollViewRef: RefObject<HTMLDivElement | null>;
  viewerRef: RefObject<HTMLDivElement | null>;
  isContentEditActive: () => boolean;
  setDefaultTool: (viewer: ToolModeViewer) => void;
}

const normalizeQuadsForPage = (
  rawQuads: unknown,
  pageNumber: number
): unknown[] => {
  if (Array.isArray(rawQuads)) return rawQuads;
  if (!rawQuads || typeof rawQuads !== "object") return [];

  const quadsByPage = rawQuads as Record<string | number, unknown>;
  const pageQuads = quadsByPage[pageNumber] ?? quadsByPage[String(pageNumber)];

  if (Array.isArray(pageQuads)) return pageQuads;

  if (pageQuads && typeof pageQuads === "object") {
    return Object.values(pageQuads).flatMap((value) =>
      Array.isArray(value) ? value : []
    );
  }

  return Object.values(quadsByPage).flatMap((value) => {
    if (Array.isArray(value)) return value;

    if (value && typeof value === "object") {
      return Object.values(value).flatMap((nestedValue) =>
        Array.isArray(nestedValue) ? nestedValue : []
      );
    }

    return [];
  });
};

const isQuadLike = (quad: unknown): quad is QuadLike => {
  if (!quad || typeof quad !== "object") return false;

  const candidate = quad as Partial<Record<keyof QuadLike, unknown>>;
  return ["x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4"].every(
    (key) => typeof candidate[key as keyof QuadLike] === "number"
  );
};

const getCommentAnnotation = (
  comment: IDocumentCommentResponse
): IDocumentAnnotationResponse | null => {
  if (!comment.annotationRef || typeof comment.annotationRef === "string") {
    return null;
  }

  return comment.annotationRef;
};

const parseAnnotationColor = (color?: string | null) => {
  const fallback = { red: 255, green: 214, blue: 10 };
  if (!color) return fallback;

  const normalized = color.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback;

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

export function useDocumentComments({
  documentId,
  canComment,
  currentPage,
  docViewerRef,
  scrollViewRef,
  viewerRef,
  isContentEditActive,
  setDefaultTool,
}: UseDocumentCommentsOptions) {
  const commentsRef = useRef<IDocumentCommentResponse[]>([]);
  const latestSelectionRef = useRef<SelectedTextInfo | null>(null);
  const commentSelectionSnapshotRef = useRef<SelectedTextInfo | null>(null);
  const isCommentInputOpenRef = useRef(false);
  const canCommentRef = useRef(canComment);
  const annotationToCommentRef = useRef<Record<string, string>>({});
  const anchorRecalculationFrameRef = useRef<number | null>(null);

  const [comments, setComments] = useState<IDocumentCommentResponse[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeCommentSource, setActiveCommentSource] = useState<
    "anchor" | "panel"
  >("anchor");
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [addBtnPos, setAddBtnPos] = useState<FloatPosition | null>(null);
  const [inputBoxPos, setInputBoxPos] = useState<FloatPosition | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [anchorPositions, setAnchorPositions] = useState<
    Record<string, FloatPosition>
  >({});
  const activeComment = activeCommentId
    ? comments.find((comment) => comment._id === activeCommentId) ?? null
    : null;

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  useEffect(() => {
    canCommentRef.current = canComment;
  }, [canComment]);

  const appendCommentIfMissing = useCallback(
    (comment: IDocumentCommentResponse) => {
      if (
        commentsRef.current.some(
          (currentComment) => currentComment._id === comment._id
        )
      ) {
        return false;
      }

      commentsRef.current = [...commentsRef.current, comment];
      setComments((currentComments) => {
        if (
          currentComments.some(
            (currentComment) => currentComment._id === comment._id
          )
        ) {
          return currentComments;
        }

        return [...currentComments, comment];
      });

      return true;
    },
    []
  );

  const handleCommentUpdated = useCallback(
    (updatedComment: IDocumentCommentResponse) => {
      const replaceComment = (sourceComments: IDocumentCommentResponse[]) =>
        sourceComments.map((comment) =>
          comment._id === updatedComment._id ? updatedComment : comment
        );

      commentsRef.current = replaceComment(commentsRef.current);
      setComments(replaceComment);
    },
    []
  );

  const handleCommentDeleted = useCallback(
    (commentId: string, realtimeAnnotationId?: string | null) => {
      const deletedComment = commentsRef.current.find(
        (comment) => comment._id === commentId
      );
      const persistedAnnotation = deletedComment
        ? getCommentAnnotation(deletedComment)
        : null;
      const mappedAnnotationIds = Object.entries(annotationToCommentRef.current)
        .filter(([, mappedCommentId]) => mappedCommentId === commentId)
        .map(([annotationId]) => annotationId);
      const annotationIds = new Set(
        [
          realtimeAnnotationId,
          persistedAnnotation?.annotationId,
          deletedComment?.annotationId,
          ...mappedAnnotationIds,
        ].filter((annotationId): annotationId is string =>
          Boolean(annotationId)
        )
      );

      for (const annotationId of annotationIds) {
        try {
          const annotationManager = docViewerRef.current?.getAnnotationManager();
          const annotation = annotationManager?.getAnnotationById(annotationId);

          if (annotation) {
            annotationManager?.deleteAnnotation(annotation, { force: true });
          }
        } catch {
          // ignore
        }

        delete annotationToCommentRef.current[annotationId];
      }

      commentsRef.current = commentsRef.current.filter(
        (comment) => comment._id !== commentId
      );
      setComments((currentComments) =>
        currentComments.filter((comment) => comment._id !== commentId)
      );
      setAnchorPositions((currentPositions) => {
        const nextPositions = { ...currentPositions };
        delete nextPositions[commentId];
        return nextPositions;
      });
      setActiveCommentId((currentId) =>
        currentId === commentId ? null : currentId
      );
    },
    [docViewerRef]
  );

  const setCommentReplyCount = useCallback(
    (commentId: string, replyCount: number) => {
      const normalizedReplyCount = Math.max(0, Number(replyCount) || 0);
      const replaceReplyCount = (sourceComments: IDocumentCommentResponse[]) =>
        sourceComments.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                replyCount: normalizedReplyCount,
              }
            : comment
        );

      commentsRef.current = replaceReplyCount(commentsRef.current);
      setComments(replaceReplyCount);
    },
    []
  );

  const getCurrentTextSelection = useCallback((): SelectedTextInfo | null => {
    const latest = latestSelectionRef.current;
    if (latest?.text.trim() && latest.quads.length > 0) return latest;

    const viewer = docViewerRef.current;
    if (!viewer) return null;

    try {
      const pageNumber = viewer.getCurrentPage?.() ?? currentPage;
      const selectedText = (
        viewer.getSelectedText?.(pageNumber) ||
        viewer.getSelectedText?.() ||
        ""
      ).trim();
      const selectedQuads = normalizeQuadsForPage(
        viewer.getSelectedTextQuads?.(pageNumber) ||
          viewer.getSelectedTextQuads?.(),
        pageNumber
      );

      if (!selectedText || selectedQuads.length === 0) return null;

      return {
        quads: selectedQuads,
        text: selectedText,
        pageNumber,
      };
    } catch {
      return null;
    }
  }, [currentPage, docViewerRef]);

  const getFloatingPosition = useCallback(
    (
      selection: SelectedTextInfo,
      placement: FloatingPlacement
    ): FloatPosition | null => {
      const scrollEl = scrollViewRef.current;
      const viewer = docViewerRef.current;

      if (!scrollEl || !viewer) return null;

      const quad = [...selection.quads].reverse().find(isQuadLike);
      if (!quad) return null;

      try {
        const displayMode = viewer.getDisplayModeManager().getDisplayMode();
        const toScrollContentPoint = (point: { x: number; y: number }) => {
          const containerRect = scrollEl.getBoundingClientRect();
          const viewerEl = viewerRef.current;
          let basePoint = { x: point.x, y: point.y };

          if (COMMENT_FLOAT_COORDINATE_MODE === "window") {
            basePoint = {
              x: point.x - containerRect.left + scrollEl.scrollLeft,
              y: point.y - containerRect.top + scrollEl.scrollTop,
            };
          }

          if (COMMENT_FLOAT_COORDINATE_MODE === "viewer" && viewerEl) {
            basePoint = {
              x: point.x + viewerEl.offsetLeft,
              y: point.y + viewerEl.offsetTop,
            };
          }

          return {
            x: basePoint.x + COMMENT_FLOAT_FINE_TUNE.x,
            y: basePoint.y + COMMENT_FLOAT_FINE_TUNE.y,
          };
        };
        const quadPoints = [
          { x: quad.x1, y: quad.y1 },
          { x: quad.x2, y: quad.y2 },
          { x: quad.x3, y: quad.y3 },
          { x: quad.x4, y: quad.y4 },
        ];
        const contentPoints = quadPoints.map((point) =>
          toScrollContentPoint(
            displayMode.pageToWindow(point, selection.pageNumber)
          )
        );
        const xs = contentPoints.map((point) => point.x);
        const ys = contentPoints.map((point) => point.y);
        const bounds = {
          right: Math.max(...xs),
          top: Math.min(...ys),
          bottom: Math.max(...ys),
          centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
        };

        if (placement === "input") {
          return {
            top: bounds.bottom + COMMENT_FLOAT_PLACEMENT_OFFSET.input.y,
            left: bounds.centerX + COMMENT_FLOAT_PLACEMENT_OFFSET.input.x,
          };
        }

        if (placement === "anchor") {
          return {
            top: bounds.top + COMMENT_FLOAT_PLACEMENT_OFFSET.anchor.y,
            left: bounds.right + COMMENT_FLOAT_PLACEMENT_OFFSET.anchor.x,
          };
        }

        return {
          top: bounds.top + COMMENT_FLOAT_PLACEMENT_OFFSET.button.y,
          left: bounds.right + COMMENT_FLOAT_PLACEMENT_OFFSET.button.x,
        };
      } catch {
        return null;
      }
    },
    [docViewerRef, scrollViewRef, viewerRef]
  );

  const calculateCommentAnchorPositions = useCallback(
    (
      sourceComments: IDocumentCommentResponse[],
      mode: AnchorUpdateMode = "replace"
    ) => {
      const nextPositions: Record<string, FloatPosition> = {};

      for (const comment of sourceComments) {
        const persistedAnnotation = getCommentAnnotation(comment);
        const pageNumber =
          persistedAnnotation?.pageNumber ?? comment.pageNumber;
        const quads = persistedAnnotation?.quads ?? [];

        if (!Array.isArray(quads) || quads.length === 0) {
          continue;
        }

        const position = getFloatingPosition(
          {
            quads,
            text:
              comment.selectedText ||
              persistedAnnotation?.contents ||
              comment.text,
            pageNumber,
          },
          "anchor"
        );

        if (position) {
          nextPositions[comment._id] = position;
        }
      }

      setAnchorPositions((currentPositions) =>
        mode === "merge"
          ? { ...currentPositions, ...nextPositions }
          : nextPositions
      );
    },
    [getFloatingPosition]
  );

  const cancelScheduledAnchorRecalculation = useCallback(() => {
    if (anchorRecalculationFrameRef.current === null) return;

    window.cancelAnimationFrame(anchorRecalculationFrameRef.current);
    anchorRecalculationFrameRef.current = null;
  }, []);

  const scheduleAnchorRecalculation = useCallback(() => {
    if (anchorRecalculationFrameRef.current !== null) return;

    anchorRecalculationFrameRef.current = window.requestAnimationFrame(() => {
      anchorRecalculationFrameRef.current = window.requestAnimationFrame(() => {
        anchorRecalculationFrameRef.current = null;
        calculateCommentAnchorPositions(commentsRef.current, "replace");
      });
    });
  }, [calculateCommentAnchorPositions]);

  useEffect(() => cancelScheduledAnchorRecalculation, [
    cancelScheduledAnchorRecalculation,
  ]);

  const hydrateLoadedComments = useCallback(
    async (
      loadedComments: IDocumentCommentResponse[],
      anchorMode: AnchorUpdateMode = "replace"
    ) => {
      const viewer = docViewerRef.current;
      if (!viewer || !window.Core) return;

      const annotationManager = viewer.getAnnotationManager();
      const { Annotations } = window.Core;

      for (const comment of loadedComments) {
        const persistedAnnotation = getCommentAnnotation(comment);
        const pageNumber =
          persistedAnnotation?.pageNumber ?? comment.pageNumber;
        const quads = persistedAnnotation?.quads ?? [];

        if (!Array.isArray(quads) || quads.length === 0) continue;

        const annotationId =
          persistedAnnotation?.annotationId ||
          comment.annotationId ||
          `comment-${comment._id}`;

        annotationToCommentRef.current[annotationId] = comment._id;

        if (!annotationManager.getAnnotationById(annotationId)) {
          const color = parseAnnotationColor(persistedAnnotation?.color);
          const annotation = new Annotations.TextHighlightAnnotation();

          annotation.Id = annotationId;
          annotation.PageNumber = pageNumber;
          annotation.Subject = "Comment";
          annotation.Author =
            persistedAnnotation?.owner ?? comment.owner.fullName;
          annotation.Color = new Annotations.Color(
            color.red,
            color.green,
            color.blue,
            0.55
          );
          annotation.Opacity = persistedAnnotation?.opacity ?? 0.45;
          annotation.setQuads?.(quads);
          annotation.setContents(persistedAnnotation?.contents || comment.text);
          annotation.setCustomData?.("commentId", comment._id);

          annotationManager.addAnnotation(annotation);
          await annotationManager.drawAnnotationsFromList(annotation);
        }
      }

      calculateCommentAnchorPositions(loadedComments, anchorMode);
    },
    [calculateCommentAnchorPositions, docViewerRef]
  );

  const closeFloatingUI = useCallback(() => {
    isCommentInputOpenRef.current = false;
    setAddBtnPos(null);
    setInputBoxPos(null);
    setCommentDraft("");
  }, []);

  const resetForDocumentLoad = useCallback(() => {
    commentsRef.current = [];
    annotationToCommentRef.current = {};
    latestSelectionRef.current = null;
    commentSelectionSnapshotRef.current = null;
    isCommentInputOpenRef.current = false;
    setComments([]);
    setActiveCommentId(null);
    setIsCommentPanelOpen(false);
    setAnchorPositions({});
    closeFloatingUI();
  }, [closeFloatingUI]);

  const openCommentInput = useCallback(
    (
      fallbackPosition?: FloatPosition,
      preferFallback = false,
      selectionOverride?: SelectedTextInfo | null
    ) => {
      if (!canCommentRef.current) return;

      if (isContentEditActive()) {
        toast.error("Finish editing before adding a comment.");
        return;
      }

      const selection = selectionOverride ?? getCurrentTextSelection();

      if (!selection) {
        toast.error("Select text before adding a comment.");
        return;
      }

      const computedPosition = preferFallback
        ? null
        : getFloatingPosition(selection, "input");
      const position =
        computedPosition ??
        (fallbackPosition
          ? {
              top: fallbackPosition.top + 44,
              left: fallbackPosition.left,
            }
          : null);

      if (!position) {
        toast.error("Could not position comment input.");
        return;
      }

      latestSelectionRef.current = selection;
      commentSelectionSnapshotRef.current = selection;
      isCommentInputOpenRef.current = true;
      setAddBtnPos(null);
      setInputBoxPos(position);
      setCommentDraft("");
    },
    [getCurrentTextSelection, getFloatingPosition, isContentEditActive]
  );

  const loadComments = useCallback(async () => {
    if (!documentId || !canCommentRef.current) return;

    try {
      const res = await commentApi.getByDocumentId(documentId);
      const loadedComments = res.data;
      const loadedCommentIds = new Set(
        loadedComments.map((comment) => comment._id)
      );
      const realtimeComments = commentsRef.current.filter(
        (comment) =>
          comment.documentId === documentId &&
          !loadedCommentIds.has(comment._id)
      );
      const mergedComments = [...loadedComments, ...realtimeComments];

      commentsRef.current = mergedComments;
      setComments(mergedComments);
      await hydrateLoadedComments(mergedComments);
    } catch (error) {
      console.warn("Failed to load comments:", error);
    }
  }, [documentId, hydrateLoadedComments]);

  const handleTextSelected = useCallback(
    (quads: unknown[], text: string, pageNumber: number) => {
      if (!canCommentRef.current) {
        latestSelectionRef.current = null;
        commentSelectionSnapshotRef.current = null;
        setAddBtnPos(null);
        setInputBoxPos(null);
        return;
      }

      const selectedText = text.trim();

      if (!selectedText || !Array.isArray(quads) || quads.length === 0) {
        if (!isCommentInputOpenRef.current) {
          latestSelectionRef.current = null;
        }

        setAddBtnPos(null);
        return;
      }

      const selection = {
        quads,
        text: selectedText,
        pageNumber,
      };
      latestSelectionRef.current = selection;
      commentSelectionSnapshotRef.current = selection;

      if (isContentEditActive()) return;

      const position = getFloatingPosition(selection, "button");

      if (position) {
        setAddBtnPos(position);
        setInputBoxPos(null);
      } else {
        setAddBtnPos(null);
      }
    },
    [getFloatingPosition, isContentEditActive]
  );

  const handleSubmitComment = useCallback(async () => {
    if (!canCommentRef.current) return;

    const draft = commentDraft.trim();

    if (!draft) {
      toast.error("Enter a comment first.");
      return;
    }

    const viewer = docViewerRef.current;
    if (!viewer) return;

    const selection = getCurrentTextSelection();

    if (!selection || selection.quads.length === 0) {
      toast.error("Select text before adding a comment.");
      return;
    }

    setIsSubmittingComment(true);

    try {
      const { Annotations } = window.Core;
      const annotation = new Annotations.TextHighlightAnnotation();
      const localAnnotationId = crypto.randomUUID
        ? crypto.randomUUID()
        : `ann-${Date.now()}`;

      annotation.Id = localAnnotationId;
      annotation.PageNumber = selection.pageNumber;
      annotation.Subject = "Comment";
      annotation.Author = "Current user";
      annotation.Color = new Annotations.Color(255, 214, 10, 0.55);
      annotation.Opacity = 0.45;
      annotation.setQuads?.(selection.quads);
      annotation.setContents(draft);

      const annotationManager = viewer.getAnnotationManager();
      annotationManager.addAnnotation(annotation);
      await annotationManager.drawAnnotationsFromList(annotation);

      const quadsPayload = selection.quads.map((quad: unknown) => {
        if (quad && typeof quad === "object") {
          return quad as Record<string, unknown>;
        }

        return {};
      });

      const res = await commentApi.create({
        documentId,
        text: draft,
        selectedText: selection.text,
        pageNumber: selection.pageNumber,
        status: "OPEN",
        annotationId: localAnnotationId,
        annotation: {
          annotationId: localAnnotationId,
          type: "TextHighlight",
          pageNumber: selection.pageNumber,
          quads: quadsPayload,
          contents: draft,
          color: "#FFD60A",
          opacity: 0.45,
        },
      });

      const newComment = res.data;
      annotationToCommentRef.current[localAnnotationId] = newComment._id;
      appendCommentIfMissing(newComment);

      const anchorPos = getFloatingPosition(selection, "anchor");
      if (anchorPos) {
        setAnchorPositions((currentPositions) => ({
          ...currentPositions,
          [newComment._id]: anchorPos,
        }));
      }

      closeFloatingUI();
      setDefaultTool(viewer);
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  }, [
    appendCommentIfMissing,
    closeFloatingUI,
    commentDraft,
    docViewerRef,
    documentId,
    getCurrentTextSelection,
    getFloatingPosition,
    setDefaultTool,
  ]);

  const scrollToCommentAnchor = useCallback(
    (commentId: string) => {
      const scrollEl = scrollViewRef.current;
      const position = anchorPositions[commentId];

      if (!scrollEl || !position) return;

      scrollEl.scrollTo({
        top: Math.max(0, position.top - 160),
        behavior: "smooth",
      });
    },
    [anchorPositions, scrollViewRef]
  );

  const handleAnchorCommentClick = useCallback(
    (comment: IDocumentCommentResponse) => {
      setActiveCommentId(comment._id);
      setActiveCommentSource("anchor");
    },
    []
  );

  const handlePanelCommentClick = useCallback(
    (comment: IDocumentCommentResponse) => {
      setActiveCommentId(comment._id);
      setActiveCommentSource("panel");

      requestAnimationFrame(() => {
        scrollToCommentAnchor(comment._id);
      });
    },
    [scrollToCommentAnchor]
  );

  const openCommentPanel = useCallback(() => {
    if (!canCommentRef.current) return;

    closeFloatingUI();
    void loadComments();
    setIsCommentPanelOpen(true);
  }, [closeFloatingUI, loadComments]);

  useEffect(() => {
    if (!documentId || !canComment) return;

    const socket = createDocumentSocket();

    const joinDocument = () => {
      socket.emit(SOCKET_EVENTS.JOIN_DOCUMENT, { documentId }, (response) => {
        if (!response.success) {
          console.error(
            "Failed to join document socket room:",
            response.error
          );
        }
      });
    };

    const handleCommentCreated = (
      payload: DocumentCommentRealtimePayload
    ) => {
      if (payload.documentId !== documentId) return;

      const comment: IDocumentCommentResponse = payload;
      const wasAdded = appendCommentIfMissing(comment);

      if (wasAdded) {
        void hydrateLoadedComments([comment], "merge");
      }
    };

    const handleRealtimeCommentUpdated = (
      payload: DocumentCommentRealtimePayload
    ) => {
      if (payload.documentId !== documentId) return;

      handleCommentUpdated(payload);
    };

    const handleRealtimeCommentDeleted = (payload: CommentDeletedPayload) => {
      if (payload.documentId !== documentId) return;

      handleCommentDeleted(payload.commentId, payload.annotationId);
    };

    const handleReplyCreatedSummary = (
      payload: ReplyCreatedSummaryPayload
    ) => {
      if (payload.documentId !== documentId) return;

      setCommentReplyCount(payload.commentId, payload.replyCount);
    };

    const handleConnectError = (error: Error) => {
      console.error("Document socket connection error:", error);
    };

    socket.on("connect", joinDocument);
    socket.on("connect_error", handleConnectError);
    socket.on(SOCKET_EVENTS.COMMENT_CREATED, handleCommentCreated);
    socket.on(SOCKET_EVENTS.COMMENT_UPDATED, handleRealtimeCommentUpdated);
    socket.on(SOCKET_EVENTS.COMMENT_DELETED, handleRealtimeCommentDeleted);
    socket.on(SOCKET_EVENTS.REPLY_CREATED_SUMMARY, handleReplyCreatedSummary);
    socket.connect();

    return () => {
      socket.off("connect", joinDocument);
      socket.off("connect_error", handleConnectError);
      socket.off(SOCKET_EVENTS.COMMENT_CREATED, handleCommentCreated);
      socket.off(SOCKET_EVENTS.COMMENT_UPDATED, handleRealtimeCommentUpdated);
      socket.off(SOCKET_EVENTS.COMMENT_DELETED, handleRealtimeCommentDeleted);
      socket.off(SOCKET_EVENTS.REPLY_CREATED_SUMMARY, handleReplyCreatedSummary);

      if (!socket.connected) {
        socket.disconnect();
        return;
      }

      const disconnectTimer = window.setTimeout(() => {
        socket.disconnect();
      }, 500);

      socket.emit(SOCKET_EVENTS.LEAVE_DOCUMENT, { documentId }, (response) => {
        window.clearTimeout(disconnectTimer);

        if (!response.success) {
          console.error(
            "Failed to leave document socket room:",
            response.error
          );
        }

        socket.disconnect();
      });
    };
  }, [
    appendCommentIfMissing,
    canComment,
    documentId,
    handleCommentDeleted,
    handleCommentUpdated,
    hydrateLoadedComments,
    setCommentReplyCount,
  ]);

  return {
    comments,
    activeComment,
    activeCommentId,
    activeCommentSource,
    setActiveCommentId,
    isCommentPanelOpen,
    setIsCommentPanelOpen,
    addBtnPos,
    inputBoxPos,
    commentDraft,
    setCommentDraft,
    isSubmittingComment,
    anchorPositions,
    commentSelectionSnapshotRef,
    loadComments,
    resetForDocumentLoad,
    closeFloatingUI,
    openCommentInput,
    handleTextSelected,
    handleSubmitComment,
    handleCommentUpdated,
    handleCommentDeleted,
    handleAnchorCommentClick,
    handlePanelCommentClick,
    openCommentPanel,
    scheduleAnchorRecalculation,
    cancelScheduledAnchorRecalculation,
  };
}
