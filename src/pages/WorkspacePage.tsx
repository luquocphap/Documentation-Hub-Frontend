import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { 
  FileText, Type, 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import emptyIllustration from "@/assets/images/empty-folder.png";
import { workspaceApi, type IWorkspaceDetailResponse, type WorkspaceItem } from "@/api/api";
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
            <EmptyWorkspace />
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