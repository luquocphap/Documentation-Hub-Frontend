// src/pages/WorkspacePage.tsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authApi, documentApi, workspaceApi, type DocumentListItem, type IWorkspaceDetailResponse, type WorkspaceItem } from "@/api/api";
import Header from "@/components/ui/Header";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { toast } from "sonner";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import EmptyWorkspace from "@/components/EmptyWorkspace";
import { DocumentList } from "@/components/documents/DocumentList";

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
  const [currentUser, setCurrentUser] = useState<any>(null); 

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
              
              <Button size="sm" className="gap-1.5 px-3">
                <FileText className="w-4 h-4" /> Create document
              </Button>
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
    </div>
  );
}