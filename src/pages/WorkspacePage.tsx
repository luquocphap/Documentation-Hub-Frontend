import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { 
  ChevronDown, FileText, Users, 
  Activity, Settings, Plus, Type, 
  LayoutGrid,
  Check
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
      toast.success("Workspace created successfully");

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
        <aside className="w-64 border-r border-border flex flex-col bg-card shrink-0">
            
            {/* Dropdown Workspace */}
            <div className="border-b border-border">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center justify-between w-full h-14 px-2 rounded-md hover:bg-secondary transition-colors outline-none">
                            <div className="flex items-center gap-2">
                                <img src={avatarIcon} alt="Workspace Avatar" className="w-8 h-8 rounded-md object-cover" />
                                <div className="flex flex-col text-left">
                                    <span className="text-xs font-semibold text-foreground truncate max-w-30">
                                        {workspace?.name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">{workspace?.userRole}</span>
                                </div>
                            </div>
                            <ChevronDown size={16} className="text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 p-2 rounded-xl shadow-lg">
                        
                        {/* Danh sách Workspace */}
                        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {workspaceList.map((ws) => {
                            const isActive = ws._id === workspaceId;
                            const role = ws.userRole; 

                            return (
                                <DropdownMenuItem 
                                    key={ws._id} 
                                    className={`flex items-center justify-between p-2 cursor-pointer rounded-lg ${isActive ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                                    onClick={() => navigate(`/workspaces/${ws._id}`)}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={avatarIcon} alt={ws.workspaceName} className="w-10 h-10 rounded-md object-cover bg-background border border-border shrink-0" />
                                        <div className="flex flex-col text-left">
                                        <span className="text-sm font-semibold text-foreground">{ws.workspaceName}</span>
                                        <span className="text-xs text-muted-foreground">{role}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Hiển thị dấu check nếu là workspace đang active */}
                                    {isActive && <Check className="w-4 h-4 text-foreground shrink-0" />}
                                </DropdownMenuItem>
                            );
                            })}
                        </div>

                        {/* Đường gạch ngang phân cách */}
                        <div className="h-px bg-border my-2" /> 
                        
                        {/* Bottom Actions */}
                        <div className="flex flex-col gap-1">
                            <DropdownMenuItem 
                                className="flex items-center gap-3 p-2 cursor-pointer rounded-lg text-sm font-medium text-foreground hover:bg-secondary" 
                                onClick={() => navigate('/dashboard')}
                            >
                                <LayoutGrid className="w-4 h-4 text-muted-foreground" /> View all
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                                className="flex items-center gap-3 p-2 cursor-pointer rounded-lg text-sm font-medium text-foreground hover:bg-secondary" 
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus className="w-4 h-4 text-muted-foreground" /> Create new Workspace
                            </DropdownMenuItem>
                        </div>

                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1 p-2">
            <Button variant="secondary" className="justify-start px-3 font-normal">
                <FileText className="mr-2 w-4 h-4 text-muted-foreground" /> Documents
            </Button>
            <Button variant="ghost" className="justify-start px-3 font-normal text-muted-foreground hover:text-foreground">
                <Users className="mr-2 w-4 h-4" /> Members
            </Button>
            
            {/* Các mục chỉ hiện tùy theo role */}
            {workspace?.userRole === "Admin" && (
                <Button variant="ghost" className="justify-start px-3 font-normal text-muted-foreground hover:text-foreground">
                    <Activity className="mr-2 w-4 h-4" /> Activity log
                </Button>
            )}
            {workspace?.userRole === "Admin" && (
                <Button variant="ghost" 
                    className="justify-start px-3 font-normal text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(`/workspaces/${workspaceId}/settings`)}
                >
                    <Settings className="mr-2 w-4 h-4" /> Settings
                </Button>
            )}
            </nav>
        </aside>

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