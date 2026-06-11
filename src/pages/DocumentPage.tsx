import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/ui/Header";
import { documentApi, type DocumentRole } from "@/api/api";
import { toast } from "sonner";
import {
  Loader2, ArrowLeft, Edit3, MessageSquare,
  Share2, Trash2, Info,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  PencilLine
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CLOUDINARY_CLOUD_NAME } from "@/lib/constant";

// Khai báo type cho Core namespace của Apryse
declare global {
  interface Window {
    Core: any;
  }
}

export default function DocumentPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  // Hai ref này là cấu trúc bắt buộc của Core API
  const scrollViewRef = useRef<HTMLDivElement>(null);   // container ngoài — có scroll
  const viewerRef = useRef<HTMLDivElement>(null);        // container trong — render PDF

  const docViewerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("Loading Document...");
  const [userRole, setUserRole] = useState<DocumentRole>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputWidth, setInputWidth] = useState<number>(0);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Đo width text mỗi khi title thay đổi
  useEffect(() => {
    if (measureRef.current) {
      setInputWidth(measureRef.current.offsetWidth);
    }
  }, [title, isEditing]);

  useEffect(() => {
    if (!documentId) return;

    const initCoreViewer = async () => {
      try {
        // 1. Fetch data từ API
        let publicId = "sample_pdf";
        let fetchedRole: DocumentRole = "Owner";

        try {
          const [docRes, roleRes] = await Promise.all([
            documentApi.getById(documentId),
            documentApi.getMyRole(documentId)
          ]);
          publicId = docRes.data.public_id || "";
          setTitle(docRes.data.title);
          fetchedRole = roleRes.data.role;
        } catch (apiError) {
          console.warn("API failed, dùng mock data:", apiError);
          setTitle("Mock Document");
        }
        setUserRole(fetchedRole);

        // 2. Load Core script nếu chưa có
        if (!window.Core) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/lib/webviewer/core/webviewer-core.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Core script"));
            document.head.appendChild(script);
          });
        }

        // 3. Cấu hình đường dẫn worker (WASM + JS)
        window.Core.setWorkerPath("/lib/webviewer/core");

        // 4. Khởi tạo DocumentViewer — đúng theo official Apryse blog
        const docViewer = new window.Core.DocumentViewer();
        docViewerRef.current = docViewer;

        docViewer.setScrollViewElement(scrollViewRef.current);
        docViewer.setViewerElement(viewerRef.current);

        // 5. Lắng nghe sự kiện
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
      // Cleanup
      if (docViewerRef.current) {
        docViewerRef.current.dispose?.();
        docViewerRef.current = null;
      }
    };
  }, [documentId]);

  const goToPage = (page: number) => {
    const dv = docViewerRef.current;
    if (!dv) return;
    const clamped = Math.min(Math.max(1, page), totalPages);
    dv.setCurrentPage(clamped);
  };

  const handleRename = async () => {
    if (!documentId || !title.trim()) return;
    setIsSaving(true);
    try {
      const res = await documentApi.update(documentId, { title: title.trim() });
      setTitle(res.data.title)
    } catch (error) {
      toast.error("Failed to rename document.");
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background font-sans overflow-hidden">
      <Header showSearch={false} />

      <main className="flex-1 w-full max-w-360 mx-auto pt-5 px-6 pb-5 flex flex-col gap-3 min-h-0">

        {/* HEADER TOOLBAR */}
        <div className="w-full h-9 rounded-lg flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-9 px-2.5 py-2 flex items-center gap-1.5 bg-white border hover:bg-gray-50 text-sm font-medium text-foreground transition-colors"
          >
            <ArrowLeft size={16} className="text-muted-foreground" />
            Back to Documents
          </Button>

          <div className="h-8 flex items-center gap-3">
            <div className="flex items-center gap-1 justify-center px-2 py-0.5 bg-secondary rounded-full">
              <span className="text-xs font-medium text-secondary-foreground tracking-wider">
                {userRole || "Loading..."}
              </span>
              <Info size={12} />
            </div>

            <div className="w-px h-4 bg-[#E5E5E5] block" />

            <div className="flex items-center gap-1.5">
              {(userRole === "Owner" || userRole === "Editor") && (
                <Button variant="ghost" size="sm" className="px-2.5 py-2 text-foreground text-sm font-medium border border-[#E5E5E5] rounded-md">
                  <Edit3 size={16} className="mr-1.5" /> Edit
                </Button>
              )}
              {(userRole === "Owner" || userRole === "Editor" || userRole === "Commenter") && (
                <Button variant="ghost" size="sm" className="px-2.5 py-2 text-foreground text-sm font-medium border border-[#E5E5E5] rounded-md">
                  <MessageSquare size={16} className="mr-1.5" /> Comment
                </Button>
              )}
              {userRole === "Owner" && (
                <>
                  <Button variant="ghost" size="sm" className="px-2.5 py-2 text-foreground text-sm font-medium border border-[#E5E5E5] rounded-md">
                    <Share2 size={16} className="mr-1.5" /> Share
                  </Button>
                  <Button variant="ghost" size="sm" className="px-2.5 py-2 text-foreground text-sm font-medium border border-[#E5E5E5] rounded-md">
                    <Trash2 size={16} className="mr-1.5" /> Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* DOCUMENT CONTAINER */}
        <div className="flex-1 w-full flex flex-col rounded-xl overflow-hidden border border-[#E5E5E5] bg-white shadow-sm min-h-0">

          {/* TITLE BAR */}
          <div
            className="h-16 py-2 pl-3 pr-4 shrink-0 flex items-center border-b border-[#E5E5E5]"
          >
            {isEditing ? (
              <>
                {/* Span ẩn để đo độ rộng text */}
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
                    if (e.key === "Escape") setIsEditing(false);
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
      </main>
    </div>
  );
}