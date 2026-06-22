import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/ui/Header";
import { documentApi, type DocumentRole } from "@/api/api";
import { toast } from "sonner";
import {
  Loader2, ArrowLeft, Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";

import { ShareDocumentModal } from "@/components/documents/ShareDocumentModal";
import { DocumentViewer } from "@/components/documents/document-viewer/DocumentViewer";
import type { DocumentViewerHandle } from "@/components/documents/document-viewer/types";
import { ChatTextIcon, NotePencilIcon, ShareNetworkIcon } from "@phosphor-icons/react";

export default function DocumentPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const viewerHandleRef = useRef<DocumentViewerHandle | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [publicId, setPublicId] = useState("");
  const [title, setTitle] = useState("Loading Document...");
  const [userRole, setUserRole] = useState<DocumentRole>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    const fetchDocumentData = async () => {
      try {

        try {
          const [docRes, roleRes] = await Promise.all([
            documentApi.getById(documentId),
            documentApi.getMyRole(documentId),
          ]);
          setPublicId(docRes.data.public_id || "");
          setTitle(docRes.data.title);
          setWorkspaceId(docRes.data.workspaceId);
          setUserRole(roleRes.data.role);
        } catch (apiError) {
          console.warn("API failed, dùng mock data:", apiError);
          setTitle("Mock Document");
        }

      } catch (error) {
        console.error("Lỗi:", error);
        toast.error("Không thể tải thông tin tài liệu");
      } finally {
        setIsLoadingMeta(false);
      }
    };

    fetchDocumentData();
  }, [documentId]);

  // Toggle content edit mode — gọi API trên handle từ DocumentViewer
  const handleToggleEdit = () => {
    const handle = viewerHandleRef.current;
    if (!handle) return;

    if (isEditMode) {
      handle.endContentEdit();
      setIsEditMode(false);
    } else {
      handle.startContentEdit();
      setIsEditMode(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background font-sans overflow-hidden">
      <Header showSearch={false} />

      <main className="flex-1 w-full max-w-360 mx-auto pt-5 px-6 pb-5 flex flex-col gap-3 min-h-0">

        {/* HEADER TOOLBAR — GIỮ NGUYÊN CSS */}
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
                // Edit button giờ có onClick toggle và đổi style khi active
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleEdit}
                  className={`px-2.5 py-2 gap-1.5 text-sm font-medium border rounded-md transition-colors ${
                    isEditMode
                      ? "bg-secondary shadow-[0px_0px_0px_3px_var(--customoutline)] border-3 border-[#A3A3A380]"
                      : "text-foreground border-[#E5E5E5]"
                  }`}
                  disabled={isEditMode}
                >
                  <NotePencilIcon size={16} />
                  {isEditMode ? "Done" : "Edit PDF"}
                </Button>
              )}
              {(userRole === "Owner" || userRole === "Editor" || userRole === "Commenter") && (
                <Button 
                  variant="ghost"
                  size="sm" 
                  onClick={() => viewerHandleRef.current?.openCommentPanel()}
                  className="px-2.5 py-2 gap-1.5 text-foreground text-sm font-medium border border-[#E5E5E5] rounded-md"
                  disabled={isEditMode}
                >
                  <ChatTextIcon size={16} /> Comments
                </Button>
              )}
              {userRole === "Owner" && (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-2.5 py-2 gap-1.5 text-foreground text-sm font-medium border border-[#E5E5E5] rounded-md">
                    <ShareNetworkIcon size={16} /> Share
                  </Button>
              )}
            </div>
          </div>
        </div>

        {/* DOCUMENT VIEWER */}
        {isLoadingMeta || !documentId ? (
          <div className="flex-1 w-full flex items-center justify-center rounded-xl border border-[#E5E5E5] bg-white shadow-sm min-h-0">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DocumentViewer
            documentId={documentId}
            publicId={publicId}
            initialTitle={title}
            onTitleUpdate={setTitle}
            onViewerInit={(handle) => {
              viewerHandleRef.current = handle;
            }}
            onSaveSuccess={() => setIsEditMode(false)}
          />
        )}

      </main>

      <ShareDocumentModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        documentId={documentId || ""}
        documentTitle={title}
        workspaceId={workspaceId}
      />
    </div>
  );
}
