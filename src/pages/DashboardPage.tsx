import { useEffect, useState } from "react";
import Header from "@/components/ui/Header";
import { Button } from "@/components/ui/Button";
import { workspaceApi, type WorkspaceItem } from "@/api/api";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);

  // Lấy dữ liệu workspace khi mount component
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await workspaceApi.getAll();
        // Giả sử API trả về mảng trực tiếp trong data
        setWorkspaces(res.data);
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      }
    };
    fetchWorkspaces();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showSearch={true} />

      {/* Component Title */}
      <div className="w-full p-7 flex items-center">
        <div className="w-[85%]">
          <h1 className="text-3xl font-bold text-foreground mb-1">Workspace</h1>
          <p className="text-sm text-primary-cyan">Create and manage your Workspaces</p>
        </div>
        <div className="flex-1 flex justify-end">
          <Button
            size="sm"
            className="px-2.5 py-2 text-sm gap-1.5"
          >
            <Plus size={16} /> Create Workspace
          </Button>
        </div>
      </div>

      {/* Component Workspace list */}
      <div className="h-125 p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Render danh sách workspace */}
          {workspaces.map((ws) => (
            <div key={ws._id} className="h-48 rounded-xl border border-border bg-card flex flex-col overflow-hidden shadow-sm">
              
              {/* Phần trên 2/3 */}
              <div className="flex-2 p-4 flex flex-col gap-3 border-b border-border">
                <div className="w-8 h-8 rounded-full bg-emerald-500 shrink-0"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground truncate">{ws.workspaceName}</span>
                  <span className="text-[10px] font-medium bg-foreground text-background px-2 py-0.5 rounded-full">
                    {ws.userRole || "Member"}
                  </span>
                </div>
                <p className="text-xs text-primary-cyan truncate">
                  {ws.workspaceDescription || "No description provided."}
                </p>
              </div>

              {/* Phần dưới 1/3 */}
              <div className="flex-1 p-4 flex items-center justify-between bg-card shrink-0">
                <div className="flex items-center gap-2">
                  <button className="w-7 h-7 rounded-full border border-dashed border-border flex items-center justify-center text-primary-cyan hover:bg-secondary transition-colors">
                    <Plus size={14} />
                  </button>
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-card"></div>
                    <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-card"></div>
                    <div className="w-7 h-7 rounded-full bg-pink-600 border-2 border-card"></div>
                  </div>
                  <span className="text-xs text-primary-cyan font-medium">+22</span>
                </div>
                <span className="text-xs text-primary-cyan">{ws.memberCount} members</span>
              </div>
            </div>
          ))}

          {/* Ô Create Workspace mặc định (luôn hiển thị) */}
          <div className="h-48 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="w-8 h-8 rounded-md bg-secondary border border-border flex items-center justify-center text-primary-cyan">
              <Plus size={18} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Create Workspace</p>
              <p className="text-xs text-primary-cyan mt-1">Click to initialize a new Workspace</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}