// src/pages/WorkspacePage.tsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FileText, Type, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authApi, documentApi, workspaceApi, type DocumentListItem, type IWorkspaceDetailResponse, type WorkspaceItem } from "@/api/api";
import Header from "@/components/ui/Header";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { toast } from "sonner";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import EmptyWorkspace from "@/components/EmptyWorkspace";
import { DocumentList } from "@/components/documents/DocumentList";
import { UploadProgressToast } from "@/components/documents/UploadProgressToast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CreateMarkdownDocumentModal } from "@/components/documents/CreateMarkdownDocumentModal";

export default function WorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<IWorkspaceDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceList, setWorkspaceList] = useState<WorkspaceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMdModalOpen, setIsMdModalOpen] = useState(false);

  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const toastedKey = useRef<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId) return;

    // Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size exceeds 20MB limit.");
      e.target.value = ""; // Xoá file đã chọn để được chọn lại
      return;
    }

    // Bật Toast Progress ở góc phải bên dưới
    toast.custom(
      (t) => (
        <UploadProgressToast
          toastId={t}
          workspaceId={workspaceId}
          file={file}
          onSuccess={async () => {
            // Khi upload 100%, tự động fetch lại document list
            try {
              const res = await documentApi.getAll(workspaceId);
              setDocuments(res.data);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      ),
      { duration: 999999, position: 'bottom-right' }
    );

    // Xóa input value để mở file explorer với cùng 1 file 2 lần không bị lỗi
    e.target.value = "";
  };

  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      if (!workspaceId) return;
      setIsLoading(true);
      try {
        const [workspaceRes, documentsRes, userRes] = await Promise.all([
          workspaceApi.getById(workspaceId),
          documentApi.getAll(workspaceId),
          authApi.getInfo()
        ]);
        
        setWorkspace(workspaceRes.data);
        setDocuments(documentsRes.data);
        setCurrentUser(userRes.data);
      } catch (error) {
        console.error("Failed to fetch workspace data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId]);

  useEffect(() => {
    const fetchWorkspaceList = async () => {
      try {
        const res = await workspaceApi.getAll();
        setWorkspaceList(res.data);
      } catch (error) {
        console.error("Failed to fetch workspace list:", error);
      }
    };
    fetchWorkspaceList();
  }, []);

  useEffect(() => {
    if (location.state?.isNewWorkspace && toastedKey.current !== location.key) {
      toast.success("Workspace created successfully", {
        style: {
          backgroundColor: "bg-green-50",
          fontFamily: 'var(--font-sans), sans-serif',
          fontWeight: 500,
          fontSize: 'text-sm',
          letterSpacing: '0%',
          border: '1px solid bg-green-700',
        },
        classNames: { icon: 'text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5' }
      });
      toastedKey.current = location.key;
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-primary-cyan">Loading workspace...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header showSearch={true} />

      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar 
          workspaceId={workspaceId}
          workspace={workspace}
          workspaceList={workspaceList}
          activeTab="documents"
          onCreateWorkspaceClick={() => setIsModalOpen(true)}
        />

        <main className="flex-1 flex flex-col items-center p-6 bg-background">
          <div className="flex flex-col gap-6 w-full max-w-300 h-full overflow-y-auto">
            
            {/* Header Area */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-end gap-3">
                <h1 className="text-2xl font-bold text-foreground leading-none">All documents</h1>
                {documents.length > 0 && (
                  <span className="text-sm font-medium text-muted-foreground mb-0.5">Total {documents.length}</span>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-1.5 px-3 outline-none">
                    <FileText className="w-4 h-4" /> Create document
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-1 rounded-xl shadow-lg min-w-48">
                  <DropdownMenuItem 
                    className="py-1 px-1.5 gap-1.5 flex items-center cursor-pointer rounded-md text-sm font-normal leading-normal whitespace-nowrap"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 text-muted-foreground" /> <p>Upload PDF</p>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="py-1 px-1.5 gap-1.5 flex items-center cursor-pointer rounded-md text-sm font-normal leading-normal whitespace-nowrap"
                    onClick={() => setIsMdModalOpen(true)}
                  >
                    <Type className="w-4 h-4 text-muted-foreground" /> <p>New blank document</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Input File ẩn */}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {/* Render Empty State OR Document List */}
            {documents.length === 0 ? (
               <EmptyWorkspace />
            ) : (
               <DocumentList 
                 documents={documents} 
                 setDocuments={setDocuments} 
                 currentUser={currentUser} 
               />
            )}

          </div>
        </main>
      </div>

      <CreateWorkspaceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={async () => {
          try {
            const res = await workspaceApi.getAll();
            setWorkspaceList(res.data);
          } catch (error) {
            console.error("Error", error);
          }
        }} 
      />

      {workspaceId && (
        <CreateMarkdownDocumentModal 
          isOpen={isMdModalOpen}
          onClose={() => setIsMdModalOpen(false)}
          workspaceId={workspaceId}
          onSuccess={async () => {
            try {
              const res = await documentApi.getAll(workspaceId);
              setDocuments(res.data);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
    </div>
  );
}