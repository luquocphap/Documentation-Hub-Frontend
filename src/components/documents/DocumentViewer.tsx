import { useEffect, useRef, useState } from "react";
import { documentApi } from "@/api/api";
import { toast } from "sonner";
import {
  Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, PencilLine,
} from "lucide-react";
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { APRYSE_LICENSE_KEY, CLOUDINARY_CLOUD_NAME } from "@/lib/constant";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

export interface DocumentViewerHandle {
  startContentEdit: () => void;
  endContentEdit: () => void;
  isContentEditActive: () => boolean;
}

interface DocumentViewerProps {
  documentId: string;
  publicId: string;
  initialTitle: string;
  onViewerInit?: (handle: DocumentViewerHandle) => void;
  onTitleUpdate?: (newTitle: string) => void;
  onSaveSuccess?: () => void;  
}

export function DocumentViewer({
  documentId,
  publicId,
  initialTitle,
  onViewerInit,
  onTitleUpdate,
  onSaveSuccess
}: DocumentViewerProps) {
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const docViewerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isContentEditMode, setIsContentEditMode] = useState(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState<number>(0);

  useEffect(() => {
    if (measureRef.current) {
      setInputWidth(measureRef.current.offsetWidth);
    }
  }, [title, isEditing]);

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

        // Preload ContentEdit WASM ngay sau khi tạo docViewer
        try {
          window.Core.ContentEdit?.preloadWorker(docViewer);
        } catch (_) {}

        docViewer.addEventListener("documentLoaded", () => {
          setTotalPages(docViewer.getPageCount());
          setCurrentPage(1);

          const pageWidth = docViewer.getPageWidth(1);
          const zoom = 616 / pageWidth;
          docViewer.zoomTo(zoom);

          // Set default tool sau khi doc load
          docViewer.setToolMode(docViewer.getTool("AnnotationEdit"));

          setIsLoading(false);
        });

        docViewer.addEventListener("pageNumberUpdated", (page: number) => {
          setCurrentPage(page);
        });

        // Expose handle ra DocumentPage
        if (onViewerInit) {
          const handle: DocumentViewerHandle = {
            startContentEdit: () => {
                try {
                    const cem = docViewer.getContentEditManager();
                    cem.startContentEditMode();

                    const toolName = window.Core.Tools.ToolNames.CONTENT_EDIT;
                    const contentEditTool = docViewer.getTool(toolName);

                    docViewer.setToolMode(contentEditTool);
                    setIsContentEditMode(true);
                } catch (e) {
                    console.error("FAILED at step:", e);
                }
            },
            endContentEdit: () => {
              try {
                const cem = docViewer.getContentEditManager();
                cem.endContentEditMode();

                // Restore về default selection tool
                docViewer.setToolMode(docViewer.getTool("AnnotationEdit"));

                setIsContentEditMode(false);
              } catch (_) {}
            },
            isContentEditActive: () => isContentEditMode,
          };
          onViewerInit(handle);
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
        try {
          docViewerRef.current.getContentEditManager?.().endContentEditMode?.();
        } catch (_) {}
        docViewerRef.current.dispose?.();
        docViewerRef.current = null;
      }
    };
  }, [publicId]);

  const goToPage = (page: number) => {
    const dv = docViewerRef.current;
    if (!dv) return;
    const clamped = Math.min(Math.max(1, page), totalPages);
    dv.setCurrentPage(clamped);
  };

  const handleRename = async () => {
    if (!documentId || !title.trim()) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await documentApi.update(documentId, { title: title.trim() });
      setTitle(res.data.title);
      if (onTitleUpdate) onTitleUpdate(res.data.title);
    } catch (error) {
      toast.error("Failed to rename document.");
      setTitle(initialTitle);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleSaveDocument = async () => {
    const dv = docViewerRef.current;
    if (!dv || !documentId) return;

    setIsSaving(true);
    try {
        // 1. Lấy document hiện tại từ Core
        const doc = dv.getDocument();

        // 2. Export thành ArrayBuffer (flatten annotations vào PDF)
        const data = await doc.getFileData({ flatten: false });
        const blob = new Blob([new Uint8Array(data)], { type: "application/pdf" });
        const file = new File([blob], `${title}.pdf`, { type: "application/pdf" });

        // 3. Lấy upload signature từ backend
        const sigRes = await documentApi.getUploadSignature(documentId);
        const { timestamp, signature, cloudName, apiKey, folder, context, notification_url } = sigRes.data;

        // 4. Upload lên Cloudinary với signature
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

        // 5. Tắt content edit mode, chuyển về view
        const cem = dv.getContentEditManager();
        cem.endContentEditMode();
        dv.setToolMode(dv.getTool("AnnotationEdit"));
        setIsContentEditMode(false);

        toast.success("Document saved successfully", {
            style: {
            backgroundColor: "bg-green-50",
            fontFamily: 'var(--font-sans), sans-serif',
            fontWeight: 500,
            fontSize: 'text-sm',
            letterSpacing: '0%',
            border: '1px solid bg-green-700',
            },
            classNames: {
            icon: 'text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5', 
            }
        });
        onSaveSuccess?.();
    } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to save document.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col rounded-xl overflow-hidden border border-[#E5E5E5] bg-white shadow-sm min-h-0">

      {/* TITLE BAR — GIỮ NGUYÊN */}
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
                if (e.key === "Escape") {
                  setTitle(initialTitle);
                  setIsEditing(false);
                }
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
                {/* Discard: tắt edit mode, không save */}
                <Button
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setIsDiscardDialogOpen(true)}
                >
                    Discard changes
                </Button>

                {/* Done: export + upload + tắt edit mode */}
                <Button
                    type="button"
                    className="text-sm font-normal"
                    disabled={isSaving}
                    onClick={handleSaveDocument}
                >
                    {isSaving
                        ? <><Loader2 size={14} className="mr-1.5 animate-spin" /> Saving...</>
                        : "Done"
                    }
                </Button>
            </div>
        )}
      </div>

      {/* APRYSE CORE VIEWER — GIỮ NGUYÊN */}
      <div className="flex-1 min-h-0">
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
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.7)",
            }}>
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
              <span className="text-sm font-medium text-gray-500">Loading document...</span>
            </div>
          )}
          <div ref={viewerRef} style={{ margin: "auto", width: "580px" }} />
        </div>
      </div>

      {/* PAGE NAVIGATION BAR — GIỮ NGUYÊN */}
      <div className="shrink-0 h-12 flex items-center justify-center gap-2 border-t border-[#E5E5E5] bg-white px-4">
        <Button variant="ghost" size="sm" onClick={() => goToPage(1)} className="h-8 w-8 p-0" disabled={isLoading || currentPage <= 1}>
          <ChevronsLeft size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage - 1)} className="h-8 w-8 p-0" disabled={isLoading || currentPage <= 1}>
          <ChevronLeft size={14} />
        </Button>
        <input
          type="number" min={1} max={totalPages} value={currentPage}
          onChange={(e) => goToPage(Number(e.target.value))}
          className="h-8 w-10 text-center text-sm font-medium text-foreground border border-[#E5E5E5] rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-sm text-muted-foreground select-none">/ {totalPages}</span>
        <Button variant="ghost" size="sm" onClick={() => goToPage(currentPage + 1)} className="h-8 w-8" disabled={isLoading || currentPage >= totalPages}>
          <ChevronRight size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => goToPage(totalPages)} className="h-8 w-8" disabled={isLoading || currentPage >= totalPages}>
          <ChevronsRight size={14} />
        </Button>
      </div>

      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent 
          showCloseButton={false} 
          className="flex flex-col w-[384px] max-w-[384px] min-h-41.5 bg-white border border-[#E5E5E5] rounded-[14px] p-0 overflow-hidden"
        >
          <div className="flex-1 px-6 pt-6 pb-4 flex flex-row gap-4 items-start w-full">
            <div className="p-4 rounded-md bg-red-100 flex items-center justify-center self-start">
              <WarningCircle className="w-6 h-6 text-[#DC2626] block" />
            </div>
            
            <DialogHeader className="text-left flex-1 gap-1 p-0">
              <DialogTitle className="text-base font-medium text-foreground">
                Discard unsaved changes?
              </DialogTitle>
              <DialogDescription className="text-sm font-normal leading-normal text-muted-foreground">
                You have unsaved changes. Leaving now will discard them. Leave anyway?
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="px-6 py-4 flex items-center justify-end gap-2 bg-gray-50/50 border-t border-border mt-auto">
            <Button 
              variant="outline" 
              onClick={() => setIsDiscardDialogOpen(false)}
              className="bg-white"
            >
              Keep editing
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                            setIsDiscarding(true);
                            const dv = docViewerRef.current;
                            if (!dv) return;
                            try {
                                dv.getContentEditManager().endContentEditMode();
                                dv.setToolMode(dv.getTool("AnnotationEdit"));
                            } catch (_) {}
                            setIsContentEditMode(false);
                            onSaveSuccess?.();

                            // load lại tài liệu
                            const fileUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.pdf`;
                            await dv.loadDocument(fileUrl);
                            setIsDiscardDialogOpen(false);
                            setIsDiscarding(false);
                        }   
                    }
            >
              {isDiscarding ? "Discarding..." : "Discard"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}