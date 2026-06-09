import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { 
  ArrowDown,
  ArrowUp,
  FileText,
  MoreVertical, 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import avatarIcon from "@/assets/images/avatar.png";
import { documentApi, workspaceApi, type DocumentListItem, type IWorkspaceDetailResponse, type WorkspaceItem } from "@/api/api";
import Header from "@/components/ui/Header";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { toast } from "sonner";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import EmptyWorkspace from "@/components/EmptyWorkspace";

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

  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      if (!workspaceId) return;
      setIsLoading(true);
      try {
        const [workspaceRes, documentsRes] = await Promise.all([
          workspaceApi.getById(workspaceId),
          documentApi.getAll(workspaceId)
        ]);
        
        setWorkspace(workspaceRes.data);
        setDocuments(documentsRes.data);
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
                        <button className="p-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors outline-none">
                          <MoreVertical size={16} />
                        </button>
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
    </div>
  );
}