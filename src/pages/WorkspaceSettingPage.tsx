import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ChevronDown, FileText, Users, Activity, Settings, 
  LayoutGrid, Plus, Check, Trash, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { CustomInput } from "@/components/CustomInput";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workspaceApi, type IWorkspaceDetailResponse, type WorkspaceItem } from "@/api/api";
import Header from "@/components/ui/Header";
import avatarIcon from "@/assets/images/avatar.png";
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { toast } from "sonner";

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  
  // States quản lý dữ liệu
  const [workspace, setWorkspace] = useState<IWorkspaceDetailResponse | null>(null);
  const [workspaceList, setWorkspaceList] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // States quản lý Form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialName, setInitialName] = useState("");
  const [initialDesc, setInitialDesc] = useState("");
  
  // States xử lý logic
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!workspaceId) return;
      setIsLoading(true);
      try {
        const [detailRes, listRes] = await Promise.all([
          workspaceApi.getById(workspaceId),
          workspaceApi.getAll()
        ]);
        
        setWorkspace(detailRes.data);
        setWorkspaceList(listRes.data);

        // Khởi tạo giá trị cho Form
        setName(detailRes.data.name);
        setDescription(detailRes.data.description || "");
        setInitialName(detailRes.data.name);
        setInitialDesc(detailRes.data.description || "");
      } catch (error) {
        toast.error("Failed to fetch workspace details.");
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [workspaceId]);

  // Logic Validate Input
  let nameError = "";
  if (hasInteracted && name.trim().length === 0) {
    nameError = "Workspace name is required.";
  } else if (name.length > 60) {
    nameError = "Workspace name must be 60 characters or fewer.";
  }
  
  const isFormValid = name.trim().length > 0 && name.length <= 60;
  const isChanged = name.trim() !== initialName || description.trim() !== initialDesc;
  const canSave = isChanged && isFormValid && !isSaving;

  // Handle Update (Custom CSS cho Toast Success theo Figma)
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave || !workspaceId) return;

    setIsSaving(true);
    try {
      await workspaceApi.update(workspaceId, { 
        name: name.trim(), 
        description: description.trim() 
      });
      
      setInitialName(name.trim());
      setInitialDesc(description.trim());
      
      toast.success("Workspace updated successfully", {
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
      
      setWorkspace(prev => prev ? { ...prev, name: name.trim(), description: description.trim() } : null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update workspace.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete thông qua Modal
  const handleDelete = async () => {
    if (!workspaceId) return;
    
    setIsDeleting(true);
    try {
      await workspaceApi.delete(workspaceId);
      toast.success("Workspace deleted successfully");
      setIsDeleteDialogOpen(false); 
      navigate("/dashboard", { replace: true }); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete workspace.");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-background text-primary-cyan">Loading settings...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header showSearch={true} />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-border flex flex-col bg-card shrink-0">
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
                      <span className="text-[11px] text-muted-foreground">Admin</span>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-2 rounded-xl shadow-lg">
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {workspaceList.map((ws) => {
                    const isActive = ws._id === workspaceId;
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
                            <span className="text-xs text-muted-foreground">{ws.userRole}</span>
                          </div>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-foreground shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
                <div className="h-px bg-border my-2" /> 
                <div className="flex flex-col gap-1">
                  <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg text-sm font-medium text-foreground hover:bg-secondary" onClick={() => navigate('/dashboard')}>
                    <LayoutGrid className="w-4 h-4 text-muted-foreground" /> View all
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-3 p-2 cursor-pointer rounded-lg text-sm font-medium text-foreground hover:bg-secondary" onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 text-muted-foreground" /> Create new Workspace
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <nav className="flex flex-col gap-1 p-2">
            <Button variant="ghost" className="justify-start px-3 font-normal text-muted-foreground hover:text-foreground" onClick={() => navigate(`/workspaces/${workspaceId}`)}>
              <FileText className="mr-2 w-4 h-4" /> Documents
            </Button>
            <Button variant="ghost" className="justify-start px-3 font-normal text-muted-foreground hover:text-foreground">
              <Users className="mr-2 w-4 h-4" /> Members
            </Button>
            <Button variant="ghost" className="justify-start px-3 font-normal text-muted-foreground hover:text-foreground">
              <Activity className="mr-2 w-4 h-4" /> Activity log
            </Button>
            <Button variant="secondary" className="justify-start px-3 font-medium text-foreground">
              <Settings className="mr-2 w-4 h-4" /> Settings
            </Button>
          </nav>
        </aside>

        {/* MAIN CONTENT (SETTINGS) */}
        <main className="flex-1 flex flex-col p-7 overflow-y-auto">
          <div className="max-w-[1128px] w-full mx-auto flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-foreground">Workspace settings</h1>

            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {/* Thẻ General */}
              <div className="bg-card border border-border rounded-[14px] flex flex-col overflow-hidden">
                <div className="px-6 py-6 pb-2">
                  <h2 className="text-base font-semibold text-foreground">General</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Manage your workspace name, domains, and more
                  </p>
                </div>
                
                <div className="p-6 pt-4 flex flex-col gap-5">
                  <CustomInput
                    id="setting-workspace-name"
                    label="Workspace name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setHasInteracted(true);
                    }}
                    onBlur={() => setHasInteracted(true)}
                    error={nameError}
                    required
                  />

                  <div className="flex flex-col gap-2 w-full">
                    <label htmlFor="setting-workspace-desc" className="text-sm font-medium text-foreground">
                      Description <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <Textarea
                      id="setting-workspace-desc"
                      placeholder="What is this Workspace for?"
                      className="resize-none min-h-[64px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <Button type="submit" disabled={!canSave} className="px-4">
                      {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            {/* Thẻ Danger Zone */}
            <div className="bg-card border border-border rounded-[14px] flex flex-col overflow-hidden">
              <div className="px-6 py-6 pb-2">
                <h2 className="text-base font-semibold text-foreground">Danger zone</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Deleting this workspace will permanently remove all documents, settings, and member access. This action cannot be undone.
                </p>
              </div>
              
              <div className="p-6 pt-4">
                <Button 
                  type="button"
                  variant="destructive" 
                  className="bg-red-500/10 text-red-600 hover:bg-red-500/20 shadow-none gap-2 font-medium"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash size={16} />
                  Delete Workspace
                </Button>
              </div>
            </div>

          </div>
        </main>
      </div>

      <CreateWorkspaceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { /* Reload Header Dropdown if needed */ }} 
      />

      {/* Delete Workspace Dialog (Với icon thùng rác đỏ theo Figma) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                Delete this workspace?
              </DialogTitle>
              <DialogDescription className="text-[14px] leading-5 text-muted-foreground">
                This will permanently delete all documents, memberships, and associated data.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="px-6 py-4 flex items-center justify-end gap-2 bg-gray-50/50 border-t border-border mt-auto">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="bg-white"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
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