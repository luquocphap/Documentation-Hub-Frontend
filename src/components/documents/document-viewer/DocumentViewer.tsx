import { useEffect, useRef, useState, useCallback } from "react";
import {
  documentApi,
  commentApi,
  type IDocumentAnnotationResponse,
  type IDocumentCommentResponse,
} from "@/api/api";
import { toast } from "sonner";
import { Loader2, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { APRYSE_LICENSE_KEY, CLOUDINARY_CLOUD_NAME } from "@/lib/constant";
import { AddCommentButton } from "./components/AddCommentButton";
import { CommentAnchor } from "./components/CommentAnchor";
import { CommentInputBox } from "./components/CommentInputBox";
import { CommentPanel } from "./components/CommentPanel";
import { DiscardDialog } from "./components/DiscardDialog";
import { PageNavigationBar } from "./components/PageNavigationBar";
import { ThreadCommentModal } from "./components/ThreadCommentModal";
import type {
  ApryseDocumentViewer,
  CommentCoordinateMode,
  DocumentViewerHandle,
  DocumentViewerProps,
  FloatPosition,
  FloatingPlacement,
  QuadLike,
  SelectedTextInfo,
  ToolModeViewer,
} from "./types";

const COMMENT_FLOAT_COORDINATE_MODE: CommentCoordinateMode = "content";
const COMMENT_FLOAT_FINE_TUNE = { x: -70, y: -170 };
const COMMENT_FLOAT_PLACEMENT_OFFSET: Record<FloatingPlacement, { x: number; y: number }> = {
  button: { x: 8, y: -36 },
  input: { x: 170, y: -50 },
  anchor: { x: 0, y: -30 },
};

export function DocumentViewer({
  documentId,
  publicId,
  initialTitle,
  onViewerInit,
  onTitleUpdate,
  onSaveSuccess,
}: DocumentViewerProps) {
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const docViewerRef = useRef<ApryseDocumentViewer | null>(null);
  const latestSelectionRef = useRef<SelectedTextInfo | null>(null);
  const commentSelectionSnapshotRef = useRef<SelectedTextInfo | null>(null);
  const isCommentInputOpenRef = useRef(false);
  const isContentEditModeRef = useRef(false);
  const onViewerInitRef = useRef(onViewerInit);
  const getFloatingPositionRef = useRef<(
    selection: SelectedTextInfo,
    placement: FloatingPlacement
  ) => FloatPosition | null>(() => null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isContentEditMode, setIsContentEditMode] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

  // API-backed comments
  const [comments, setComments] = useState<IDocumentCommentResponse[]>([]);
  const commentsRef = useRef<IDocumentCommentResponse[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeCommentSource, setActiveCommentSource] = useState<"anchor" | "panel">("anchor");

  // Mapping from annotationId → commentId (for anchor lookup)
  const annotationToCommentRef = useRef<Record<string, string>>({});

  // Floating UI state
  const [addBtnPos, setAddBtnPos] = useState<FloatPosition | null>(null);
  const [inputBoxPos, setInputBoxPos] = useState<FloatPosition | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Anchor positions: commentId → FloatPosition
  const [anchorPositions, setAnchorPositions] = useState<Record<string, FloatPosition>>({});
  const activeComment = activeCommentId
    ? comments.find((comment) => comment._id === activeCommentId) ?? null
    : null;

  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState<number>(0);

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  const handleReplyCreated = useCallback((commentId: string) => {
    setComments((prev) => prev.map((comment) => {
      if (comment._id !== commentId) return comment;
      return {
        ...comment,
        replyCount: Number(comment.replyCount || 0) + 1,
      };
    }));
  }, []);


  useEffect(() => {
    isContentEditModeRef.current = isContentEditMode;
  }, [isContentEditMode]);

  useEffect(() => {
    onViewerInitRef.current = onViewerInit;
  }, [onViewerInit]);


  const setDefaultViewerTool = (dv: ToolModeViewer) => {
    try {
      const textSelectToolName = window.Core?.Tools?.ToolNames?.TEXT_SELECT ?? "TextSelect";
      const textSelectTool = dv.getTool(textSelectToolName) || dv.getTool("TextSelect");
      if (textSelectTool) { dv.setToolMode(textSelectTool); return; }
    } catch { /* fall through */ }
    try { dv.setToolMode(dv.getTool("AnnotationEdit")); } catch { /* ignore */ }
  };

  const normalizeQuadsForPage = useCallback((rawQuads: unknown, pageNumber: number): unknown[] => {
    if (Array.isArray(rawQuads)) return rawQuads;
    if (!rawQuads || typeof rawQuads !== "object") return [];
    const quadsByPage = rawQuads as Record<string | number, unknown>;
    const pageQuads = quadsByPage[pageNumber] ?? quadsByPage[String(pageNumber)];
    if (Array.isArray(pageQuads)) return pageQuads;
    if (pageQuads && typeof pageQuads === "object") {
      return Object.values(pageQuads).flatMap((v) => Array.isArray(v) ? v : []);
    }
    return Object.values(quadsByPage).flatMap((v) => {
      if (Array.isArray(v)) return v;
      if (v && typeof v === "object") return Object.values(v).flatMap((n) => Array.isArray(n) ? n : []);
      return [];
    });
  }, []);

  const isQuadLike = (quad: unknown): quad is QuadLike => {
    if (!quad || typeof quad !== "object") return false;
    const candidate = quad as Partial<Record<keyof QuadLike, unknown>>;
    return ["x1", "y1", "x2", "y2", "x3", "y3", "x4", "y4"]
      .every((key) => typeof candidate[key as keyof QuadLike] === "number");
  };

  const getCommentAnnotation = useCallback((comment: IDocumentCommentResponse): IDocumentAnnotationResponse | null => {
    if (!comment.annotationRef || typeof comment.annotationRef === "string") return null;
    return comment.annotationRef;
  }, []);

  const handleCommentUpdated = useCallback((updatedComment: IDocumentCommentResponse) => {
    setComments((prev) => prev.map((comment) => (
      comment._id === updatedComment._id ? updatedComment : comment
    )));
  }, []);

  const handleCommentDeleted = useCallback((commentId: string) => {
    const deletedComment = commentsRef.current.find((comment) => comment._id === commentId);
    const persistedAnnotation = deletedComment ? getCommentAnnotation(deletedComment) : null;
    const annotationId =
      persistedAnnotation?.annotationId ||
      deletedComment?.annotationId ||
      Object.entries(annotationToCommentRef.current)
        .find(([, mappedCommentId]) => mappedCommentId === commentId)?.[0];

    if (annotationId) {
      try {
        const annotationManager = docViewerRef.current?.getAnnotationManager();
        const annotation = annotationManager?.getAnnotationById(annotationId);
        if (annotation) {
          annotationManager?.deleteAnnotation(annotation, { force: true });
        }
      } catch { /* ignore */ }

      delete annotationToCommentRef.current[annotationId];
    }

    setComments((prev) => prev.filter((comment) => comment._id !== commentId));
    setAnchorPositions((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
    setActiveCommentId((currentId) => currentId === commentId ? null : currentId);
  }, [getCommentAnnotation]);

  const parseAnnotationColor = useCallback((color?: string | null) => {
    const fallback = { red: 255, green: 214, blue: 10 };
    if (!color) return fallback;

    const normalized = color.replace("#", "").trim();
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback;

    return {
      red: Number.parseInt(normalized.slice(0, 2), 16),
      green: Number.parseInt(normalized.slice(2, 4), 16),
      blue: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }, []);

  const getCurrentTextSelection = useCallback((): SelectedTextInfo | null => {
    const latest = latestSelectionRef.current;
    if (latest?.text.trim() && latest.quads.length > 0) return latest;
    const dv = docViewerRef.current;
    if (!dv) return null;
    try {
      const pageNumber = dv.getCurrentPage?.() ?? currentPage;
      const selectedText = (dv.getSelectedText?.(pageNumber) || dv.getSelectedText?.() || "").trim();
      const selectedQuads = normalizeQuadsForPage(
        dv.getSelectedTextQuads?.(pageNumber) || dv.getSelectedTextQuads?.(),
        pageNumber
      );
      if (!selectedText || selectedQuads.length === 0) return null;
      return { quads: selectedQuads, text: selectedText, pageNumber };
    } catch { return null; }
  }, [currentPage, normalizeQuadsForPage]);

  const getApryseSelectionPosition = useCallback((
    selection: SelectedTextInfo,
    placement: FloatingPlacement
  ): FloatPosition | null => {
    const scrollEl = scrollViewRef.current;
    const dv = docViewerRef.current;
    if (!scrollEl || !dv) return null;

    const quad = [...selection.quads].reverse().find(isQuadLike);
    if (!quad) return null;

    try {
      const displayMode = dv.getDisplayModeManager().getDisplayMode();
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
      const contentPoints = quadPoints.map((point) => {
        return toScrollContentPoint(displayMode.pageToWindow(point, selection.pageNumber));
      });
      const xs = contentPoints.map((point) => point.x);
      const ys = contentPoints.map((point) => point.y);
      const bounds = {
        left: Math.min(...xs),
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
  }, []);

  const getFloatingPosition = useCallback((
    selection: SelectedTextInfo,
    placement: FloatingPlacement
  ) => {
    return getApryseSelectionPosition(selection, placement);
  }, [getApryseSelectionPosition]);

  const hydrateLoadedComments = useCallback(async (loadedComments: IDocumentCommentResponse[]) => {
    const dv = docViewerRef.current;
    if (!dv || !window.Core) return;

    const annotationManager = dv.getAnnotationManager();
    const nextAnchorPositions: Record<string, FloatPosition> = {};
    const { Annotations } = window.Core;

    for (const comment of loadedComments) {
      const persistedAnnotation = getCommentAnnotation(comment);
      const pageNumber = persistedAnnotation?.pageNumber ?? comment.pageNumber;
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
        annotation.Author = persistedAnnotation?.owner ?? comment.owner.fullName;
        annotation.Color = new Annotations.Color(color.red, color.green, color.blue, 0.55);
        annotation.Opacity = persistedAnnotation?.opacity ?? 0.45;
        annotation.setQuads?.(quads);
        annotation.setContents(persistedAnnotation?.contents || comment.text);
        annotation.setCustomData?.("commentId", comment._id);

        annotationManager.addAnnotation(annotation);
        await annotationManager.drawAnnotationsFromList(annotation);
      }

      const anchorPos = getFloatingPosition({
        quads,
        text: comment.selectedText || persistedAnnotation?.contents || comment.text,
        pageNumber,
      }, "anchor");

      if (anchorPos) {
        nextAnchorPositions[comment._id] = anchorPos;
      }
    }

    setAnchorPositions(nextAnchorPositions);
  }, [getCommentAnnotation, getFloatingPosition, parseAnnotationColor]);

  // Close all floating UIs
  const closeFloatingUI = useCallback(() => {
    isCommentInputOpenRef.current = false;
    setAddBtnPos(null);
    setInputBoxPos(null);
    setCommentDraft("");
  }, []);

  // Open add-comment input (called from button click or toolbar button)
  const openCommentInput = useCallback((
    fallbackPosition?: FloatPosition,
    preferFallback = false,
    selectionOverride?: SelectedTextInfo | null
  ) => {
    if (isContentEditModeRef.current) {
      toast.error("Finish editing before adding a comment.");
      return;
    }
    const selection = selectionOverride ?? getCurrentTextSelection();
    if (!selection) {
      toast.error("Select text before adding a comment.");
      return;
    }

    const computedPosition = preferFallback ? null : getFloatingPosition(selection, "input");
    const position = computedPosition ?? (
      fallbackPosition
        ? { top: fallbackPosition.top + 44, left: fallbackPosition.left }
        : null
    );
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
  }, [getCurrentTextSelection, getFloatingPosition]);

  useEffect(() => {
    getFloatingPositionRef.current = getFloatingPosition;
  });

  // Load comments from API 
  const loadComments = useCallback(async () => {
    if (!documentId) return;
    try {
      const res = await commentApi.getByDocumentId(documentId);
      const loadedComments = res.data;
      commentsRef.current = loadedComments;
      setComments(loadedComments);
      await hydrateLoadedComments(loadedComments);
    } catch (err) {
      console.warn("Failed to load comments:", err);
    }
  }, [documentId, hydrateLoadedComments]);

  // Submit new comment
  const handleSubmitComment = async () => {
    const draft = commentDraft.trim();
    if (!draft) { toast.error("Enter a comment first."); return; }

    const dv = docViewerRef.current;
    if (!dv) return;

    const selection = getCurrentTextSelection();
    if (!selection || selection.quads.length === 0) {
      toast.error("Select text before adding a comment.");
      return;
    }

    setIsSubmittingComment(true);
    try {
      const { Annotations } = window.Core;
      const annotation = new Annotations.TextHighlightAnnotation();
      const localAnnotationId = crypto.randomUUID ? crypto.randomUUID() : `ann-${Date.now()}`;

      annotation.Id = localAnnotationId;
      annotation.PageNumber = selection.pageNumber;
      annotation.Subject = "Comment";
      annotation.Author = "Current user";
      annotation.Color = new Annotations.Color(255, 214, 10, 0.55);
      annotation.Opacity = 0.45;
      annotation.setQuads?.(selection.quads);
      annotation.setContents(draft);

      const annotationManager = dv.getAnnotationManager();
      annotationManager.addAnnotation(annotation);
      await annotationManager.drawAnnotationsFromList(annotation);

      // Build quads payload for API
      const quadsPayload = selection.quads.map((q: unknown) => {
        if (q && typeof q === "object") return q as Record<string, unknown>;
        return {};
      });

      // Call API
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
      setComments((prev) => [...prev, newComment]);

      const anchorPos = getFloatingPosition(selection, "anchor");
      if (anchorPos) {
        setAnchorPositions((prev) => ({ ...prev, [newComment._id]: anchorPos }));
      }

      closeFloatingUI();
      setDefaultViewerTool(dv);
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast.error("Failed to add comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const scrollToCommentAnchor = useCallback((commentId: string) => {
    const scrollEl = scrollViewRef.current;
    const position = anchorPositions[commentId];

    if (!scrollEl || !position) return;

    scrollEl.scrollTo({
      top: Math.max(0, position.top - 160),
      behavior: "smooth",
    });
  }, [anchorPositions]);

  const handleAnchorCommentClick = useCallback((comment: IDocumentCommentResponse) => {
    setActiveCommentId(comment._id);
    setActiveCommentSource("anchor");
  }, []);

  const handlePanelCommentClick = useCallback((comment: IDocumentCommentResponse) => {
    setActiveCommentId(comment._id);
    setActiveCommentSource("panel");

    requestAnimationFrame(() => {
      scrollToCommentAnchor(comment._id);
    });
  }, [scrollToCommentAnchor]);

  // Measure input width for rename
  useEffect(() => {
    if (measureRef.current) setInputWidth(measureRef.current.offsetWidth);
  }, [title, isEditing]);

  // Init Apryse
  useEffect(() => {
    if (!publicId) return;

    const initCoreViewer = async () => {
      try {
        if (!window.Core) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/lib/webviewer/core/webviewer-core.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Core script"));
            document.head.appendChild(script);
          });
        }

        window.Core.setWorkerPath("/lib/webviewer/core");

        const docViewer = new window.Core.DocumentViewer({ licenseKey: APRYSE_LICENSE_KEY });
        docViewerRef.current = docViewer;

        docViewer.setScrollViewElement(scrollViewRef.current);
        docViewer.setViewerElement(viewerRef.current);
        docViewer.enableAnnotations();

        try { window.Core.ContentEdit?.preloadWorker(docViewer); } catch { /* ignore */ }

        const annotationManager = docViewer.getAnnotationManager();

        annotationManager.addEventListener?.("annotationSelected", (annotations, action) => {
          if (action !== "selected") return;
          const sel = annotations.find((a) => a.Subject === "Comment");
          if (!sel) return;
          // Could open a view panel in future; for now just close floating UI
          closeFloatingUI();
        });

        docViewer.addEventListener("documentLoaded", () => {
          setComments([]);
          setActiveCommentId(null);
          setIsCommentPanelOpen(false);
          setAnchorPositions({});
          annotationToCommentRef.current = {};
          closeFloatingUI();
          latestSelectionRef.current = null;
          commentSelectionSnapshotRef.current = null;
          isCommentInputOpenRef.current = false;
          setTotalPages(docViewer.getPageCount());
          setCurrentPage(1);
          const pageWidth = docViewer.getPageWidth(1);
          docViewer.zoomTo(616 / pageWidth);
          setDefaultViewerTool(docViewer);
          setIsLoading(false);
          // Load existing comments
          loadComments();
        });

        docViewer.addEventListener("pageNumberUpdated", (page: number) => setCurrentPage(page));

        docViewer.addEventListener("textSelected", (quads: unknown[], text: string, pageNumber: number) => {
          const selectedText = text.trim();
          if (!selectedText || !Array.isArray(quads) || quads.length === 0) {
            if (!isCommentInputOpenRef.current) {
              latestSelectionRef.current = null;
            }
            setAddBtnPos(null);
            return;
          }
          const selection = { quads, text: selectedText, pageNumber };
          latestSelectionRef.current = selection;
          commentSelectionSnapshotRef.current = selection;

          // Show add comment button
          if (isContentEditModeRef.current) return;

          const position = getFloatingPositionRef.current(
            selection,
            "button"
          );
          if (position) {
            setAddBtnPos(position);
            setInputBoxPos(null);
          } else {
            setAddBtnPos(null);
          }
        });

        // Expose handle to parent
        const onViewerInitCallback = onViewerInitRef.current;
        if (onViewerInitCallback) {
          const handle: DocumentViewerHandle = {
            startContentEdit: () => {
              try {
                const cem = docViewer.getContentEditManager();
                cem.startContentEditMode();
                const toolName = window.Core.Tools.ToolNames.CONTENT_EDIT;
                docViewer.setToolMode(docViewer.getTool(toolName));
                isContentEditModeRef.current = true;
                setIsContentEditMode(true);
                setIsCommentPanelOpen(false);
                closeFloatingUI();
              } catch (e) { console.error("FAILED at step:", e); }
            },
            endContentEdit: () => {
              try {
                docViewer.getContentEditManager().endContentEditMode();
                setDefaultViewerTool(docViewer);
                isContentEditModeRef.current = false;
                setIsContentEditMode(false);
              } catch { /* ignore */ }
            },
            isContentEditActive: () => isContentEditModeRef.current,
            openCommentPanel: () => {
              closeFloatingUI();
              void loadComments();
              setIsCommentPanelOpen(true);
            },
          };
          onViewerInitCallback(handle);
        }

        const fileUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.pdf`;
        docViewer.loadDocument(fileUrl);
      } catch (error) {
        console.error("Failed to initialize Core viewer:", error);
        toast.error("Failed to load document.");
        setIsLoading(false);
      }
    };

    initCoreViewer();

    return () => {
      if (docViewerRef.current) {
        try { docViewerRef.current.getContentEditManager?.().endContentEditMode?.(); } catch { /* ignore */ }
        docViewerRef.current.dispose?.();
        docViewerRef.current = null;
      }
    };
  }, [publicId, closeFloatingUI, loadComments]);

  // Page navigation
  const goToPage = (page: number) => {
    const dv = docViewerRef.current;
    if (!dv) return;
    dv.setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  // Rename
  const handleRename = async () => {
    if (!documentId || !title.trim()) { setIsEditing(false); return; }
    setIsSaving(true);
    try {
      const res = await documentApi.update(documentId, { title: title.trim() });
      setTitle(res.data.title);
      onTitleUpdate?.(res.data.title);
    } catch {
      toast.error("Failed to rename document.");
      setTitle(initialTitle);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  // Save document
  const handleSaveDocument = async () => {
    const dv = docViewerRef.current;
    if (!dv || !documentId) return;
    setIsSaving(true);
    try {
      const doc = dv.getDocument();
      const data = await doc.getFileData({ flatten: false });
      const blob = new Blob([new Uint8Array(data)], { type: "application/pdf" });
      const file = new File([blob], `${title}.pdf`, { type: "application/pdf" });

      const sigRes = await documentApi.getUploadSignature(documentId);
      const { timestamp, signature, cloudName, apiKey, folder, context, notification_url } = sigRes.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("api_key", apiKey);
      formData.append("folder", folder);
      formData.append("context", context);
      formData.append("notification_url", notification_url);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadRes.ok) throw new Error("Upload failed");

      const cem = dv.getContentEditManager();
      cem.endContentEditMode();
      setDefaultViewerTool(dv);
      isContentEditModeRef.current = false;
      setIsContentEditMode(false);

      toast.success("Document saved successfully", {
        style: {
          backgroundColor: "bg-green-50",
          fontFamily: "var(--font-sans), sans-serif",
          fontWeight: 500,
          fontSize: "text-sm",
          letterSpacing: "0%",
          border: "1px solid bg-green-700",
        },
        classNames: {
          icon: "text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5",
        },
      });
      onSaveSuccess?.();
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save document.");
    } finally {
      setIsSaving(false);
    }
  };

  // Discard changes
  const handleDiscardChanges = async () => {
    setIsDiscarding(true);
    const dv = docViewerRef.current;
    if (!dv) {
      setIsDiscarding(false);
      return;
    }

    try {
      try {
        dv.getContentEditManager().endContentEditMode();
        setDefaultViewerTool(dv);
      } catch { /* ignore */ }

      isContentEditModeRef.current = false;
      setIsContentEditMode(false);
      onSaveSuccess?.();

      const fileUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.pdf`;
      await dv.loadDocument(fileUrl);
      setIsDiscardDialogOpen(false);
    } finally {
      setIsDiscarding(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col rounded-xl overflow-hidden border border-[#E5E5E5] bg-white shadow-sm min-h-0">

      {/* TITLE BAR */}
      <div className="h-16 py-2 pl-3 pr-4 shrink-0 flex items-center border-b border-[#E5E5E5]">
        {isEditing ? (
          <>
            <span
              ref={measureRef}
              className="text-lg font-medium invisible absolute whitespace-pre py-1 px-2.5"
              aria-hidden
            >
              {title}
            </span>
            <input
              ref={inputRef}
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") { setTitle(initialTitle); setIsEditing(false); }
              }}
              style={{ width: inputWidth || "auto" }}
              className="text-lg py-1 px-2.5 font-medium text-foreground border rounded-lg"
            />
          </>
        ) : (
          <button
            onClick={() => {
              setIsEditing(true);
              requestAnimationFrame(() => {
                if (inputRef.current) {
                  const len = inputRef.current.value.length;
                  inputRef.current.setSelectionRange(len, len);
                }
              });
            }}
            className="flex items-center gap-1.5"
          >
            <span className="text-lg font-medium text-foreground truncate flex-1">{title}</span>
            {isSaving
              ? <Loader2 size={16} className="text-muted-foreground shrink-0 animate-spin" />
              : <PencilLine size={16} className="text-muted-foreground shrink-0" />
            }
          </button>
        )}

        {isContentEditMode && (
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" disabled={isSaving} onClick={() => setIsDiscardDialogOpen(true)}>
              Discard changes
            </Button>
            <Button type="button" className="text-sm font-normal" disabled={isSaving} onClick={handleSaveDocument}>
              {isSaving ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> Saving...</> : "Done"}
            </Button>
          </div>
        )}
      </div>

      {/* APRYSE CORE VIEWER */}
      <div className="flex-1 min-h-0 bg-[#f3f4f6] relative">
        <div className="h-full min-w-0 min-h-0">
          <div
            ref={scrollViewRef}
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
            {isLoading && (
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
                <span className="text-sm font-medium text-gray-500">Loading document...</span>
              </div>
            )}

            <div ref={viewerRef} style={{ margin: "auto", width: "580px" }} />

            {/* Floating add-comment button (shown after text selection) */}
            {addBtnPos && !inputBoxPos && (
              <AddCommentButton
                position={addBtnPos}
                onClick={() => openCommentInput(
                  addBtnPos,
                  true,
                  commentSelectionSnapshotRef.current
                )}
              />
            )}

            {/* Comment input box */}
            {inputBoxPos && (
              <CommentInputBox
                position={inputBoxPos}
                value={commentDraft}
                onChange={setCommentDraft}
                onSubmit={handleSubmitComment}
                onClose={closeFloatingUI}
                isSubmitting={isSubmittingComment}
              />
            )}

            {/* Comment anchors on annotated text */}
            {comments.map((comment) => {
              if (comment._id === activeCommentId) return null;
              const pos = anchorPositions[comment._id];
              if (!pos) return null;
              return (
                <CommentAnchor
                  key={comment._id}
                  position={pos}
                  comment={comment}
                  onClick={handleAnchorCommentClick}
                />
              );
            })}
          </div>
        </div>

        {activeComment && (
          <ThreadCommentModal
            key={activeComment._id}
            comment={activeComment}
            placement={activeCommentSource}
            onClose={() => setActiveCommentId(null)}
            onReplyCreated={handleReplyCreated}
            onCommentUpdated={handleCommentUpdated}
            onCommentDeleted={handleCommentDeleted}
          />
        )}

        {isCommentPanelOpen && (
          <CommentPanel
            comments={comments}
            onClose={() => setIsCommentPanelOpen(false)}
            onSelectComment={handlePanelCommentClick}
          />
        )}
      </div>

      <PageNavigationBar
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={goToPage}
      />

      <DiscardDialog
        open={isDiscardDialogOpen}
        isDiscarding={isDiscarding}
        onOpenChange={setIsDiscardDialogOpen}
        onDiscard={handleDiscardChanges}
      />
    </div>
  );
}
