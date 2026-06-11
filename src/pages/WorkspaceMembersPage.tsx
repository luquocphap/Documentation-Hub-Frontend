import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { 
  ChevronDown, Trash2,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  workspaceApi, 
  type IWorkspaceDetailResponse, 
  type WorkspaceItem, 
  type IWorkspaceMemberItem,
  type IWorkspaceRole,
  authApi
} from "@/api/api";
import Header from "@/components/ui/Header";
import avatarIcon from "@/assets/images/avatar.png";
import { InviteMemberModal } from "@/components/InviteMemberModal";
import { toast } from "sonner";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  
  const [workspace, setWorkspace] = useState<IWorkspaceDetailResponse | null>(null);
  const [workspaceList, setWorkspaceList] = useState<WorkspaceItem[]>([]);
  const [members, setMembers] = useState<IWorkspaceMemberItem[]>([]);
  const [roles, setRoles] = useState<IWorkspaceRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // States cho các Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<IWorkspaceMemberItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWorkspaceData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const [detailRes, listRes, membersRes, rolesRes, userRes] = await Promise.all([
        workspaceApi.getById(workspaceId),
        workspaceApi.getAll(),
        workspaceApi.getMembers(workspaceId),
        workspaceApi.getRoles(),
        authApi.getInfo()
      ]);
      
      setWorkspace(detailRes.data);
      setWorkspaceList(listRes.data);
      setMembers(membersRes.data);
      setRoles(rolesRes.data);
      setCurrentUserId(userRes.data.id);
    } catch (error) {
      toast.error("Failed to fetch data.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  // Xử lý thay đổi Role
  const handleChangeRole = async (userId: string, newRoleId: string) => {
    if (!workspaceId) return;
    try {
      await workspaceApi.changeMemberRole(workspaceId, { userId, roleId: newRoleId });
      
      // Update local state để phản hồi UI ngay lập tức
      const updatedRoleName = roles.find(r => r._id === newRoleId)?.name || "Member";
      setMembers(prev => prev.map(m => 
        m.userId === userId ? { ...m, roleId: newRoleId, role: updatedRoleName } : m
      ));
      
      toast.success("Role updated successfully", {
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role.");
    }
  };

  const handleDeleteMember = async () => {
  if (!workspaceId || !memberToRemove) return;
  
  setIsDeleting(true);
  try {
    await workspaceApi.deleteMember(workspaceId, memberToRemove.userId);
    
    // Xóa thành viên vừa chọn khỏi danh sách hiển thị trên UI ngay lập tức
    setMembers((prev) => prev.filter((m) => m.userId !== memberToRemove.userId));
    
    toast.success("Member removed successfully", {
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
    setMemberToRemove(null); // Đóng modal
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Failed to remove member.");
    console.error("Delete member error:", error);
  } finally {
    setIsDeleting(false);
  }
};

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-primary-cyan">Loading members...</div>;
  }

  const isAdmin = workspace?.userRole === "Admin";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header showSearch={true} />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR BẢN SAO */}
        <WorkspaceSidebar
          activeTab="members"
          workspace={workspace}
          workspaceList={workspaceList}
          workspaceId={workspaceId}
          onCreateWorkspaceClick={() => setIsCreateModalOpen(true)}
        />

        {/* MAIN CONTENT: MEMBER LIST */}
        <main className="flex-1 flex flex-col items-center p-6 bg-background">
          <div className="flex flex-col gap-6 w-full max-w-300 h-full overflow-y-auto">
            
            {/* Header Area */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-end gap-3">
                <h1 className="text-2xl font-bold text-foreground leading-none">Members</h1>
                <span className="text-sm font-medium text-muted-foreground mb-0.5">Total {members.length}</span>
              </div>
              
              {isAdmin && (
                <Button size="sm" className="gap-1.5 px-3" onClick={() => setIsInviteModalOpen(true)}>
                  <UserPlus size={16} /> Invite member
                </Button>
              )}
            </div>

            {/* Table Area */}
            <div className="w-full flex flex-col">
              {/* Table Head */}
              <div className="flex items-center py-3 border-b border-border text-sm font-semibold text-foreground">
                <div className="flex-1 min-w-0">Name</div>
                <div className="w-40.75 shrink-0">Owner</div>
                {isAdmin && <div className="w-77 shrink-0 text-right pr-2">Actions</div>}
              </div>

              {/* Table Body */}
              <div className="flex flex-col">
                {members.map((member) => (
                  <div key={member.userId} className="flex items-center py-3 border-b border-border group hover:bg-secondary/30 transition-colors">
                    
                    {/* Cột 1: Hiển thị thêm chữ (You) nếu trùng ID */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <img src={avatarIcon} alt={member.fullName} className="w-8 h-8 rounded-full border border-border object-cover shrink-0 bg-background" />
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {member.fullName}
                          {member.userId === currentUserId && <span className="text-muted-foreground font-normal"> (You)</span>}
                        </span>
                        <span className="text-sm text-muted-foreground truncate">{member.email}</span>
                      </div>
                    </div>

                    {/* Cột 2: Xử lý chặn đổi Role của chính mình */}
                    <div className="w-40.75 shrink-0 flex items-center">
                      {member.userId === currentUserId ? (
                        <span className="text-[13px] font-medium text-foreground bg-secondary px-3 py-1.5 rounded-full">
                          {member.role}
                        </span>
                      ) : isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="flex items-center gap-1.5 text-[13px] font-medium text-foreground bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-full transition-colors outline-none">
                            {member.role} <ChevronDown size={14} className="text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-36 p-1 rounded-xl shadow-lg">
                            {roles.map(r => (
                              <DropdownMenuItem 
                                key={r._id} 
                                className="p-2 cursor-pointer rounded-lg text-sm"
                                onClick={() => handleChangeRole(member.userId, r._id)}
                              >
                                {r.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        // Nếu mình chỉ là Member thông thường -> Chỉ xem dạng badge tĩnh
                        <span className="text-[13px] font-medium text-foreground bg-secondary px-3 py-1.5 rounded-full">
                          {member.role}
                        </span>
                      )}
                    </div>

                    {/* Cột 3: Chặn hiển thị nút xóa chính mình */}
                    {isAdmin && (
                      <div className="w-77 shrink-0 flex items-center justify-end pr-2">
                        {/* Chỉ hiển thị nút Thùng rác nếu thành viên đó KHÔNG PHẢI là bản thân mình */}
                        {member.userId !== currentUserId && (
                          <button 
                            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            onClick={() => setMemberToRemove(member)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Invite Member Modal */}
      {workspace && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => {
            setIsInviteModalOpen(false);
            fetchWorkspaceData();
          }} 
          workspace={{
            _id: workspace._id,
            workspaceName: workspace.name,
            workspaceDescription: workspace.description,
            userRole: workspace.userRole,
            createdAt: workspace.created_at,
            memberCount: workspace.memberCount,
            joinedAt: new Date().toISOString()
          }} 
        />
      )}

      <CreateWorkspaceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => { /* Reload Header Dropdown if needed */ }} 
      />

      {/* Remove Member Dialog (Giao diện giữ chỗ) */}
      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && !isDeleting && setMemberToRemove(null)}>
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
                Remove from Workspace?
              </DialogTitle>
              <DialogDescription className="text-[14px] leading-5 text-muted-foreground">
                They will lose access to this workspace and all its documents.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Footer Actions */}
          <div className="px-6 py-4 flex items-center justify-end gap-2 bg-gray-50/50 border-t border-border mt-auto">
            <Button 
              variant="outline" 
              onClick={() => setMemberToRemove(null)}
              className="bg-white"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteMember}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}