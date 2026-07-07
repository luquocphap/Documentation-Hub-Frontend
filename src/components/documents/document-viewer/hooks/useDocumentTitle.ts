import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { documentApi } from "@/api/api";

const MAX_DOCUMENT_TITLE_LENGTH = 255;

interface UseDocumentTitleOptions {
  documentId: string;
  initialTitle: string;
  onTitleUpdate?: (newTitle: string) => void;
}

export function useDocumentTitle({
  documentId,
  initialTitle,
  onTitleUpdate,
}: UseDocumentTitleOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inputWidth, setInputWidth] = useState<number>(0);
  const isTooLong = value.length > MAX_DOCUMENT_TITLE_LENGTH;

  useEffect(() => {
    setValue(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (measureRef.current) {
      setInputWidth(measureRef.current.offsetWidth);
    }
  }, [value, isEditing]);

  const startEditing = useCallback(() => {
    setIsEditing(true);

    requestAnimationFrame(() => {
      if (!inputRef.current) return;

      const valueLength = inputRef.current.value.length;
      inputRef.current.setSelectionRange(valueLength, valueLength);
    });
  }, []);

  const reset = useCallback(() => {
    setValue(initialTitle);
    setIsEditing(false);
  }, [initialTitle]);

  const rename = useCallback(async () => {
    const nextTitle = value.trim();

    if (!documentId || !nextTitle) {
      setIsEditing(false);
      return;
    }

    if (isTooLong) return;

    setIsSaving(true);

    try {
      const res = await documentApi.update(documentId, {
        title: nextTitle,
      });

      setValue(res.data.title);
      onTitleUpdate?.(res.data.title);
    } catch {
      toast.error("Failed to rename document.");
      setValue(initialTitle);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [documentId, initialTitle, isTooLong, onTitleUpdate, value]);

  return {
    value,
    setValue,
    isEditing,
    setIsEditing,
    isSaving,
    isTooLong,
    inputRef,
    measureRef,
    inputWidth,
    startEditing,
    rename,
    reset,
  };
}
