import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { APRYSE_LICENSE_KEY, CLOUDINARY_CLOUD_NAME } from "@/lib/constant";
import type {
  ApryseAnnotation,
  ApryseDocumentViewer,
  ToolModeViewer,
} from "../types";

interface UseApryseViewerOptions {
  publicId: string;
  showCommentAnnotations: boolean;
  onDocumentLoaded?: (viewer: ApryseDocumentViewer) => void;
  onTextSelected?: (
    quads: unknown[],
    text: string,
    pageNumber: number
  ) => void;
  onLayoutUpdated?: () => void;
  onCommentAnnotationSelected?: () => void;
}

const isCommentAnnotation = (annotation: ApryseAnnotation) => {
  const subject = annotation.Subject?.trim().toLowerCase();
  const customCommentId = annotation.getCustomData?.("commentId");

  return (
    subject === "comment" ||
    Boolean(customCommentId) ||
    annotation.Id.startsWith("comment-")
  );
};

export function useApryseViewer({
  publicId,
  showCommentAnnotations,
  onDocumentLoaded,
  onTextSelected,
  onLayoutUpdated,
  onCommentAnnotationSelected,
}: UseApryseViewerOptions) {
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const docViewerRef = useRef<ApryseDocumentViewer | null>(null);
  const onDocumentLoadedRef = useRef(onDocumentLoaded);
  const onTextSelectedRef = useRef(onTextSelected);
  const onLayoutUpdatedRef = useRef(onLayoutUpdated);
  const onCommentAnnotationSelectedRef = useRef(onCommentAnnotationSelected);
  const showCommentAnnotationsRef = useRef(showCommentAnnotations);

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    onDocumentLoadedRef.current = onDocumentLoaded;
    onTextSelectedRef.current = onTextSelected;
    onLayoutUpdatedRef.current = onLayoutUpdated;
    onCommentAnnotationSelectedRef.current = onCommentAnnotationSelected;
    showCommentAnnotationsRef.current = showCommentAnnotations;
  }, [
    onCommentAnnotationSelected,
    onDocumentLoaded,
    onLayoutUpdated,
    showCommentAnnotations,
    onTextSelected,
  ]);

  const getDocumentUrl = useCallback(
    () =>
      `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.pdf`,
    [publicId]
  );

  const setDefaultTool = useCallback((viewer: ToolModeViewer) => {
    try {
      const textSelectToolName =
        window.Core?.Tools?.ToolNames?.TEXT_SELECT ?? "TextSelect";
      const textSelectTool =
        viewer.getTool(textSelectToolName) || viewer.getTool("TextSelect");

      if (textSelectTool) {
        viewer.setToolMode(textSelectTool);
        return;
      }
    } catch {
      // fall through
    }

    try {
      viewer.setToolMode(viewer.getTool("AnnotationEdit"));
    } catch {
      // ignore
    }
  }, []);

  const syncCommentAnnotationVisibility = useCallback(
    (viewer: ApryseDocumentViewer) => {
      try {
        const annotationManager = viewer.getAnnotationManager();
        const commentAnnotations = annotationManager
          .getAnnotationsList()
          .filter(isCommentAnnotation);

        if (commentAnnotations.length === 0) return;

        if (showCommentAnnotationsRef.current) {
          annotationManager.showAnnotations(commentAnnotations);
          return;
        }

        annotationManager.hideAnnotations(commentAnnotations);
      } catch {
        // ignore
      }
    },
    []
  );

  const reloadDocument = useCallback(async () => {
    const viewer = docViewerRef.current;
    if (!viewer) return;

    setIsLoading(true);
    await viewer.loadDocument(getDocumentUrl());
  }, [getDocumentUrl]);

  const goToPage = useCallback(
    (page: number) => {
      const viewer = docViewerRef.current;
      if (!viewer) return;

      viewer.setCurrentPage(Math.min(Math.max(1, page), totalPages));
    },
    [totalPages]
  );

  useEffect(() => {
    if (!publicId) return;

    let disposed = false;

    const initCoreViewer = async () => {
      try {
        setIsLoading(true);

        if (!window.Core) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/lib/webviewer/core/webviewer-core.min.js";
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Failed to load Core script"));
            document.head.appendChild(script);
          });
        }

        if (disposed) return;

        window.Core.setWorkerPath("/lib/webviewer/core");

        const docViewer = new window.Core.DocumentViewer({
          licenseKey: APRYSE_LICENSE_KEY,
        });
        docViewerRef.current = docViewer;

        docViewer.setScrollViewElement(scrollViewRef.current);
        docViewer.setViewerElement(viewerRef.current);
        docViewer.enableAnnotations();

        try {
          window.Core.ContentEdit?.preloadWorker?.(docViewer);
        } catch {
          // ignore
        }

        const annotationManager = docViewer.getAnnotationManager();
        annotationManager.addEventListener?.(
          "annotationSelected",
          (annotations, action) => {
            if (action !== "selected") return;

            const selectedCommentAnnotation = annotations.find(
              (annotation) => annotation.Subject === "Comment"
            );

            if (selectedCommentAnnotation) {
              onCommentAnnotationSelectedRef.current?.();
            }
          }
        );

        const handleViewerLayoutUpdated = () => {
          syncCommentAnnotationVisibility(docViewer);
          onLayoutUpdatedRef.current?.();
        };

        docViewer.addEventListener("zoomUpdated", handleViewerLayoutUpdated);
        docViewer.addEventListener("pageComplete", handleViewerLayoutUpdated);
        docViewer.addEventListener("annotationsLoaded", () => {
          syncCommentAnnotationVisibility(docViewer);
        });

        docViewer.addEventListener("documentLoaded", () => {
          setTotalPages(docViewer.getPageCount());
          setCurrentPage(1);

          const pageWidth = docViewer.getPageWidth(1);
          docViewer.zoomTo(616 / pageWidth);
          setDefaultTool(docViewer);
          syncCommentAnnotationVisibility(docViewer);
          setIsLoading(false);
          onDocumentLoadedRef.current?.(docViewer);
        });

        docViewer.addEventListener("pageNumberUpdated", (page: number) =>
          setCurrentPage(page)
        );

        docViewer.addEventListener(
          "textSelected",
          (quads: unknown[], text: string, pageNumber: number) => {
            onTextSelectedRef.current?.(quads, text, pageNumber);
          }
        );

        await docViewer.loadDocument(getDocumentUrl());
      } catch (error) {
        console.error("Failed to initialize Core viewer:", error);
        toast.error("Failed to load document.");
        setIsLoading(false);
      }
    };

    void initCoreViewer();

    return () => {
      disposed = true;

      if (docViewerRef.current) {
        try {
          docViewerRef.current
            .getContentEditManager?.()
            .endContentEditMode?.();
        } catch {
          // ignore
        }

        docViewerRef.current.dispose?.();
        docViewerRef.current = null;
      }
    };
  }, [getDocumentUrl, publicId, setDefaultTool, syncCommentAnnotationVisibility]);

  useEffect(() => {
    const viewer = docViewerRef.current;
    if (!viewer) return;

    syncCommentAnnotationVisibility(viewer);
  }, [showCommentAnnotations, syncCommentAnnotationVisibility]);

  return {
    scrollViewRef,
    viewerRef,
    docViewerRef,
    isLoading,
    currentPage,
    totalPages,
    goToPage,
    setDefaultTool,
    reloadDocument,
  };
}
