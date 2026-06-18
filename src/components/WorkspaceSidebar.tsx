import { useNavigate } from "react-router-dom";
import { 
  ChevronDown, Check, LayoutGrid, Plus, 
  FileText, Users, Activity, Settings 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import avatarIcon from "@/assets/images/avatar.png";
import type { IWorkspaceDetailResponse, WorkspaceItem } from "@/api/api";

export type SidebarTab = "documents" | "members" | "activity" | "settings";

interface WorkspaceSidebarProps {
  workspaceId: string | undefined;
  workspace: IWorkspaceDetailResponse | null;
  workspaceList: WorkspaceItem[];
  activeTab: SidebarTab;
  onCreateWorkspaceClick: () => void;
}

export function WorkspaceSidebar({
  workspaceId,
  workspace,
  workspaceList,
  activeTab,
  onCreateWorkspaceClick,
}: WorkspaceSidebarProps) {
  const navigate = useNavigate();

  // Hàm tiện ích để style nút tùy theo việc nó có đang được chọn hay không
  const getButtonProps = (tabName: SidebarTab) => {
    const isActive = activeTab === tabName;

    return {
      variant: (isActive ? "secondary" : "ghost") as "secondary" | "ghost",
      className: `justify-start px-3 ${
        isActive 
          ? "font-medium text-foreground" 
          : "font-normal text-muted-foreground hover:text-foreground"
      }`,
    };
  };

  return (
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
                    className={`flex items-center justify-between p-2 cursor-pointer rounded-lg ${
                      isActive ? "bg-secondary" : "hover:bg-secondary/50"
                    }`}
                    onClick={() => navigate(`/workspaces/${ws._id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarIcon}
                        alt={ws.workspaceName}
                        className="w-10 h-10 rounded-md object-cover bg-background border border-border shrink-0"
                      />
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
                onClick={() => navigate("/dashboard")}
              >
                <LayoutGrid className="w-4 h-4 text-muted-foreground" /> View all
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-3 p-2 cursor-pointer rounded-lg text-sm font-medium text-foreground hover:bg-secondary"
                onClick={onCreateWorkspaceClick}
              >
                <Plus className="w-4 h-4 text-muted-foreground" /> Create new Workspace
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 p-2">
        <Button {...getButtonProps("documents")} onClick={() => navigate(`/workspaces/${workspaceId}`)}>
          <FileText className="mr-2 w-4 h-4" /> Documents
        </Button>
        
        <Button {...getButtonProps("members")} onClick={() => navigate(`/workspaces/${workspaceId}/members`)}>
          <Users className="mr-2 w-4 h-4" /> Members
        </Button>

        {/* Các mục chỉ hiện tùy theo role */}
        {workspace?.userRole === "Admin" && (
          <Button {...getButtonProps("activity")} onClick={() => navigate(`/workspaces/${workspaceId}/activity-logs`)}>
            <Activity className="mr-2 w-4 h-4" /> Activity log
          </Button>
        )}
        
        {workspace?.userRole === "Admin" && (
          <Button {...getButtonProps("settings")} onClick={() => navigate(`/workspaces/${workspaceId}/settings`)}>
            <Settings className="mr-2 w-4 h-4" /> Settings
          </Button>
        )}
      </nav>
    </aside>
  );
}