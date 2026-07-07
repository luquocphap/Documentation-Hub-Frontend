import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";
import { documentApi } from "@/api/api";
import type { ApryseDocumentViewer, ToolModeViewer } from "../types";

interface UseDocumentEditOptions {
  documentId: string;
  title: string;
  docViewerRef: RefObject<ApryseDocumentViewer | null>;
  setDefaultTool: (viewer: ToolModeViewer) => void;
  reloadDocument: () => Promise<void>;
  closeCommentUI: () => void;
  closeCommentPanel: () => void;
  onSaveSuccess?: () => void;
}

export function useDocumentEdit({
  documentId,
  title,
  docViewerRef,
  setDefaultTool,
  reloadDocument,
  closeCommentUI,
  closeCommentPanel,
  onSaveSuccess,
}: UseDocumentEditOptions) {
  const isContentEditModeRef = useRef(false);
  const [isContentEditMode, setIsContentEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const setContentEditMode = useCallback((value: boolean) => {
    isContentEditModeRef.current = value;
    setIsContentEditMode(value);
  }, []);

  const isContentEditActive = useCallback(
    () => isContentEditModeRef.current,
    []
  );

  const startContentEdit = useCallback(() => {
    const viewer = docViewerRef.current;
    if (!viewer) return;

    try {
      const contentEditManager = viewer.getContentEditManager();
      void contentEditManager.startContentEditMode();

      const toolName = window.Core.Tools.ToolNames.CONTENT_EDIT;
      viewer.setToolMode(viewer.getTool(toolName));
      setContentEditMode(true);
      closeCommentPanel();
      closeCommentUI();
    } catch (error) {
      console.error("Failed to start content edit:", error);
      toast.error("Failed to start editing.");
    }
  }, [
    closeCommentPanel,
    closeCommentUI,
    docViewerRef,
    setContentEditMode,
  ]);

  const endContentEdit = useCallback(() => {
    const viewer = docViewerRef.current;
    if (!viewer) return;

    try {
      viewer.getContentEditManager().endContentEditMode();
      setDefaultTool(viewer);
      setContentEditMode(false);
    } catch {
      // ignore
    }
  }, [docViewerRef, setContentEditMode, setDefaultTool]);

  const commitActiveContentEdit = useCallback(
    async (viewer: ApryseDocumentViewer) => {
      const annotationManager = viewer.getAnnotationManager();
      const contentEditManager = viewer.getContentEditManager();
      const selectedAnnotation = annotationManager
        .getSelectedAnnotations()
        .find((annotation) =>
          Boolean(annotation.getCustomData?.("contentEditBoxId"))
        );
      const contentBoxId =
        selectedAnnotation?.getCustomData?.("contentEditBoxId");

      if (!contentBoxId) return;

      const contentBox = contentEditManager.getContentBoxById(contentBoxId);
      if (!contentBox?.isEditing()) return;

      await new Promise<void>((resolve, reject) => {
        const handleEditEnded = () => {
          contentEditManager.removeEventListener(
            "contentBoxEditEnded",
            handleEditEnded
          );
          resolve();
        };

        contentEditManager.addEventListener(
          "contentBoxEditEnded",
          handleEditEnded
        );

        try {
          contentBox.stopContentEditing();
        } catch (error) {
          contentEditManager.removeEventListener(
            "contentBoxEditEnded",
            handleEditEnded
          );
          reject(error);
        }
      });
    },
    []
  );

  const saveDocument = useCallback(async () => {
    const viewer = docViewerRef.current;
    if (!viewer || !documentId) return;

    setIsSaving(true);

    try {
      await commitActiveContentEdit(viewer);

      const doc = viewer.getDocument();
      const data = await doc.getFileData({ flatten: false });
      const blob = new Blob([new Uint8Array(data)], {
        type: "application/pdf",
      });
      const file = new File([blob], `${title}.pdf`, {
        type: "application/pdf",
      });

      const sigRes = await documentApi.getUploadSignature(documentId);
      const {
        timestamp,
        signature,
        cloudName,
        apiKey,
        folder,
        context,
        notification_url,
      } = sigRes.data;

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

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      viewer.getContentEditManager().endContentEditMode();
      setDefaultTool(viewer);
      setContentEditMode(false);

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
  }, [
    commitActiveContentEdit,
    docViewerRef,
    documentId,
    onSaveSuccess,
    setContentEditMode,
    setDefaultTool,
    title,
  ]);

  const discardChanges = useCallback(async () => {
    setIsDiscarding(true);

    try {
      const viewer = docViewerRef.current;
      if (!viewer) return;

      try {
        viewer.getContentEditManager().endContentEditMode();
        setDefaultTool(viewer);
      } catch {
        // ignore
      }

      setContentEditMode(false);
      onSaveSuccess?.();
      await reloadDocument();
      setIsDiscardDialogOpen(false);
    } finally {
      setIsDiscarding(false);
    }
  }, [
    docViewerRef,
    onSaveSuccess,
    reloadDocument,
    setContentEditMode,
    setDefaultTool,
  ]);

  return {
    isContentEditMode,
    isContentEditActive,
    isSaving,
    isDiscarding,
    isDiscardDialogOpen,
    setIsDiscardDialogOpen,
    startContentEdit,
    endContentEdit,
    saveDocument,
    discardChanges,
  };
}
