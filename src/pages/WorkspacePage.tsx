import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { 
  ArrowDown,
  ArrowUp,
  FileText,
  Link,
  MoreVertical,
  Pencil,
  Trash2, 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import avatarIcon from "@/assets/images/avatar.png";
import { authApi, documentApi, workspaceApi, type DocumentListItem, type IWorkspaceDetailResponse, type WorkspaceItem } from "@/api/api";
import Header from "@/components/ui/Header";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { toast } from "sonner";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import EmptyWorkspace from "@/components/EmptyWorkspace";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<IWorkspaceDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceList, setWorkspaceList] = useState<WorkspaceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const toastedKey = useRef<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"DESC" | "ASC">("DESC");

  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [docToDelete, setDocToDelete] = useState<DocumentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      if (!workspaceId) return;
      setIsLoading(true);
      try {
        // Gọi thêm authApi.getInfo() cùng lúc
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
        classNames: {
          icon: 'text-white [&>svg]:text-white [&>svg]:fill-green-700 [&>svg]:w-5 [&>svg]:h-5', 
        }
      });

      // Đánh dấu là phiên điều hướng này đã hiển thị thông báo
      toastedKey.current = location.key;
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    
    setIsDeleting(true);
    try {
      await documentApi.delete(docToDelete.id);
      
      // Xóa thành công thì loại khỏi mảng state hiện tại
      setDocuments(prev => prev.filter(doc => doc.id !== docToDelete.id));
      
      toast.success("Document removed successfully", {
        style: {
          width: '300px',
          height: '52px',
          borderRadius: 'var(--radius-md, 6px)',
          border: '1px solid var(--base-border, #E5E5E5)',
          padding: '16px',
          gap: '8px',
          background: 'var(--base-popover, #FFFFFF)',
          boxShadow: '0px 4px 12px -1px rgba(0, 0, 0, 0.1)',
          color: 'hsl(var(--foreground))',
          fontFamily: 'var(--font-sans), sans-serif',
          fontSize: '14px',
          fontWeight: 500,
        },
        classNames: { icon: 'text-black [&>svg]:fill-black [&>svg]:text-white [&>svg]:w-5 [&>svg]:h-5' } 
      });
      setDocToDelete(null); // Đóng modal
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete document.");
      console.error("Delete document error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    return sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
  });

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-primary-cyan">Loading workspace...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header showSearch={true} />

      <div className="flex flex-1 overflow-hidden">
        {/* CỘT TRÁI: SIDEBAR */}
        <WorkspaceSidebar 
          workspaceId={workspaceId}
          workspace={workspace}
          workspaceList={workspaceList}
          activeTab="documents"
          onCreateWorkspaceClick={() => setIsModalOpen(true)}
        />

        {/* CỘT PHẢI: MAIN CONTENT */}
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
              
              <Button size="sm" className="gap-1.5 px-3">
                <FileText className="w-4 h-4" /> Create document
              </Button>
            </div>

            {/* Content Area: Danh sách hoặc Empty State */}
            {documents.length === 0 ? (
               <EmptyWorkspace />
            ) : (
              <div className="w-full flex flex-col">
                {/* Table Head */}
                <div className="flex items-center py-3 border-b border-border text-sm font-medium text-foreground">
                  <div className="flex-1 min-w-0">File name</div>
                  <div className="w-98.25 shrink-0">Owner</div>
                  <div 
                    className="w-49.75 shrink-0 flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors group/sort"
                    onClick={() => setSortOrder(prev => prev === "DESC" ? "ASC" : "DESC")}
                  >
                    Updated date 
                    {sortOrder === "DESC" ? (
                      <ArrowDown size={14} className="text-muted-foreground group-hover/sort:text-foreground" />
                    ) : (
                      <ArrowUp size={14} className="text-muted-foreground group-hover/sort:text-foreground" />
                    )}
                  </div>
                  <div className="w-21.75 shrink-0"></div>
                </div>

                {/* Table Body */}
                <div className="flex flex-col">
                  {sortedDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center py-3 border-b border-border group hover:bg-secondary/30 transition-colors">
                      
                      {/* Column 1: File name */}
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className="p-2 rounded border border-border flex items-center justify-center bg-secondary shrink-0 text-muted-foreground">
                          <FileText size={16} />
                        </div>
                        <span className="text-sm font-medium text-foreground truncate">{doc.title}</span>
                      </div>

                      {/* Column 2: Owner */}
                      <div className="w-98.25 shrink-0 flex items-center p-2 gap-2">
                        <img src={avatarIcon} alt={doc.ownerName} className="w-5 h-5 rounded-full border border-border object-cover shrink-0 bg-background" />
                        <span className="text-sm text-foreground truncate">{doc.ownerName}</span>
                      </div>

                      {/* Column 3: Updated Date */}
                      <div className="w-49.75 shrink-0 flex items-center">
                        <span className="text-sm text-foreground truncate">
                          {new Date(doc.updatedAt).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>

                      {/* Column 4: Actions */}
                      <div className="w-21.75 shrink-0 flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors outline-none">
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg p-1">
                            
                            {/* Nút Open File - Ai cũng thấy */}
                            <DropdownMenuItem 
                              className="p-2 cursor-pointer rounded-lg text-sm font-medium" 
                              onClick={() => toast.info("Open file logic coming soon")}
                            >
                              <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Open file
                            </DropdownMenuItem>

                            {/* Chỉ hiển thị các nút thao tác khác nếu User là Owner */}
                            {doc.ownerId === currentUser?.id && (
                              <>
                                <DropdownMenuItem 
                                  className="p-2 cursor-pointer rounded-lg text-sm font-medium"
                                  onClick={() => toast.info("Rename logic coming soon")}
                                >
                                  <Pencil className="w-4 h-4 mr-2 text-muted-foreground" /> Rename
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  className="p-2 cursor-pointer rounded-lg text-sm font-medium"
                                  onClick={() => toast.info("Share logic coming soon")}
                                >
                                  <Link className="w-4 h-4 mr-2 text-muted-foreground" /> Share
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                  className="p-2 cursor-pointer rounded-lg text-sm font-medium text-red-600 focus:text-red-600 focus:bg-red-50 transition-colors"
                                  onClick={() => setDocToDelete(doc)} // Mở modal xóa
                                >
                                  <Trash2 className="w-4 h-4 mr-2 text-red-600" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                            
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      <CreateWorkspaceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          const fetchWorkspaceList = async () => {
            try {
              const res = await workspaceApi.getAll();
              setWorkspaceList(res.data);
            } catch (error) {
              console.error("Error", error);
            }
          };
          fetchWorkspaceList();
        }} 
      />

      {/* Delete Document Dialog */}
      <Dialog open={!!docToDelete} onOpenChange={(open) => !open && !isDeleting && setDocToDelete(null)}>
        <DialogContent 
          showCloseButton={false} 
          className="flex flex-col w-[384px] max-w-[384px] min-h-41.5 bg-white border border-[#E5E5E5] rounded-[14px] p-0 overflow-hidden"
        >
          <div className="flex-1 px-6 pt-6 pb-4 flex flex-row gap-4 items-start w-full">
            <div className="p-4 rounded-md bg-red-100 flex items-center justify-center self-start">
              <Trash2 className="w-6 h-6 text-[#DC2626] block" />
            </div>
            
            <DialogHeader className="text-left flex-1 gap-1 p-0">
              <DialogTitle className="text-[18px] font-semibold text-foreground">
                Delete document?
              </DialogTitle>
              <DialogDescription className="text-[14px] leading-5 text-muted-foreground">
                This permanently deletes the document, including all comments and shared access.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="px-6 py-4 flex items-center justify-end gap-2 bg-gray-50/50 border-t border-border mt-auto">
            <Button 
              variant="outline" 
              onClick={() => setDocToDelete(null)}
              disabled={isDeleting}
              className="bg-white"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDocument}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}