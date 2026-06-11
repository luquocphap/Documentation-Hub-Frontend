import { useEffect, useRef, useState } from "react";
import { documentApi } from "@/api/api";
import { toast } from "sonner";
import {
  Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, PencilLine
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CLOUDINARY_CLOUD_NAME } from "@/lib/constant";

interface DocumentViewerProps {
  documentId: string;
  publicId: string;
  initialTitle: string;
  onViewerInit?: (docViewerInstance: any) => void;
  onTitleUpdate?: (newTitle: string) => void;
}

export function DocumentViewer({ documentId, publicId, initialTitle, onViewerInit, onTitleUpdate }: DocumentViewerProps) {
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const docViewerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState<number>(0);

  // Đo width text mỗi khi title thay đổi
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
        const docViewer = new window.Core.DocumentViewer();
        docViewerRef.current = docViewer;

        if (onViewerInit) onViewerInit(docViewer);

        docViewer.setScrollViewElement(scrollViewRef.current);
        docViewer.setViewerElement(viewerRef.current);

        docViewer.addEventListener("documentLoaded", () => {
          setTotalPages(docViewer.getPageCount());
          setCurrentPage(1);

          const pageWidth = docViewer.getPageWidth(1);
          const zoom = 616 / pageWidth;
          console.log(zoom)
          docViewer.zoomTo(zoom);
          setIsLoading(false);
        });

        docViewer.addEventListener("pageNumberUpdated", (page: number) => {
          setCurrentPage(page);
        });

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

  // GIỮ NGUYÊN 100% CÁC CLASS CSS VÀ STYLE CỦA BẠN
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
      </div>

      {/* APRYSE CORE VIEWER */}
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
            <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.7)" }}>
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
              <span className="text-sm font-medium text-gray-500">Loading document...</span>
            </div>
          )}
          <div ref={viewerRef} style={{ margin: "auto", width: "580px" }} />
        </div>
      </div>

      {/* PAGE NAVIGATION BAR */}
      <div className="shrink-0 h-12 flex items-center justify-center gap-2 border-t border-[#E5E5E5] bg-white px-4">
        <Button
          variant="ghost" size="sm"
          onClick={() => goToPage(1)}
          className="h-8 w-8 p-0"
          disabled={isLoading || currentPage <= 1}
        >
          <ChevronsLeft size={14} />
        </Button>
        <Button
          variant="ghost" size="sm"
          onClick={() => goToPage(currentPage - 1)}
          className="h-8 w-8 p-0"
          disabled={isLoading || currentPage <= 1}
        >
          <ChevronLeft size={14} />
        </Button>

        <input
          type="number" min={1} max={totalPages} value={currentPage}
          onChange={(e) => goToPage(Number(e.target.value))}
          className="h-8 w-10 text-center text-sm font-medium text-foreground border border-[#E5E5E5] rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-sm text-muted-foreground select-none">/ {totalPages}</span>

        <Button
          variant="ghost" size="sm"
          onClick={() => goToPage(currentPage + 1)}
          className="h-8 w-8"
          disabled={isLoading || currentPage >= totalPages}
        >
          <ChevronRight size={14} />
        </Button>
        <Button
          variant="ghost" size="sm"
          onClick={() => goToPage(totalPages)}
          className="h-8 w-8"
          disabled={isLoading || currentPage >= totalPages}
        >
          <ChevronsRight size={14} />
        </Button>
      </div>

    </div>
  );
}