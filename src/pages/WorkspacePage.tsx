import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { 
  FileText, Type, 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import avatarIcon from "@/assets/images/avatar.png";
import emptyIllustration from "@/assets/images/empty-folder.png";
import { workspaceApi, type IWorkspaceDetailResponse, type WorkspaceItem } from "@/api/api";
import Header from "@/components/ui/Header";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { toast } from "sonner";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";

export default function WorkspacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<IWorkspaceDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceList, setWorkspaceList] = useState<WorkspaceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toastedKey = useRef<string | null>(null);

  useEffect(() => {
    const fetchWorkspaceDetails = async () => {
      if (!workspaceId) return;
      setIsLoading(true);
      try {
        const response = await workspaceApi.getById(workspaceId);
        setWorkspace(response.data);
      } catch (error) {
        console.error("Failed to fetch workspace:", error);
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
        <main className="flex-1 relative flex flex-col">
            <div className="p-7 flex flex-col flex-1">
            
                {/* Header của Main Content */}
                <div className="flex items-center justify-between w-full mb-8">
                    <h1 className="text-2xl font-bold text-foreground">All documents</h1>
                    <Button size="sm" className="gap-1.5 px-3">
                        <FileText className="w-4 h-4" /> Create document
                    </Button>
                </div>

                <div className="w-full h-145 flex flex-col gap-8 mx-auto">
                    
                    {/* THẺ TRÊN: Khu vực upload (Dashed border) */}
                    <div className="w-full h-112.5 max-h-112.5 rounded-lg border border-dashed border-border bg-card/50 flex flex-col items-center justify-center gap-2.5 py-2.5 px-3">
                    
                        <img 
                            src={emptyIllustration} 
                            alt="Upload illustration" 
                            className="w-75 h-auto mb-4 opacity-80" 
                        />
                        
                        <div className="text-center flex flex-col gap-1.5">
                            <h3 className="text-sm font-semibold text-foreground">Upload your first document</h3>
                            <p className="text-sm text-muted-foreground">
                                Drag & drop or click to upload a PDF (max 20MB).
                            </p>
                        </div>
                    </div>

                    {/* THẺ DƯỚI: Nút tạo mới (Center Content) */}
                    <div className="w-45.5 h-16 mx-auto flex flex-col items-center justify-center gap-3">
                        <span className="text-[13px] text-muted-foreground">or start from scratch</span>
                        <Button variant="outline" size="sm" className="w-full gap-2 text-foreground font-medium shadow-sm">
                            <Type className="w-4 h-4 text-muted-foreground" /> New blank document
                        </Button>
                    </div>

                </div>
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