import { useParams, Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/ui/Header";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { useWorkspace, workspaceQueryKeys } from "@/queries/useWorkspaceQueries";
import { useUIStore } from "@/stores/useUIStore";

export function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const queryClient = useQueryClient();
  const { data: workspace, isLoading } = useWorkspace(workspaceId);

  const isCreateOpen = useUIStore((s) => s.isCreateWorkspaceOpen);
  const closeCreateModal = useUIStore((s) => s.closeCreateWorkspaceModal);

  if (isLoading && !workspace) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-primary-cyan">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header showSearch={true} />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <WorkspaceSidebar />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.lists() });
        }}
      />
    </div>
  );
}

export default WorkspaceLayout;
