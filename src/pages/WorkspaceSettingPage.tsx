import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Trash, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { CustomInput } from "@/components/CustomInput";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workspaceApi } from "@/api/api";
import { toast } from "sonner";
import { useWorkspace, workspaceQueryKeys } from "@/queries/useWorkspaceQueries";

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  
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
    if (workspace) {
      setName(workspace.name);
      setDescription(workspace.description || "");
      setInitialName(workspace.name);
      setInitialDesc(workspace.description || "");
    }
  }, [workspace]);

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

  // Handle Update
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
      
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.lists() });

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
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.lists() });

      toast.success("Workspace deleted successfully", {
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
      setIsDeleteDialogOpen(false); 
      navigate("/dashboard", { replace: true }); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete workspace.");
      setIsDeleting(false);
    }
  };

  if (isLoading && !workspace) {
    return <div className="flex flex-1 items-center justify-center bg-background text-primary-cyan">Loading settings...</div>;
  }

  return (
    <main className="flex-1 flex flex-col p-7 overflow-y-auto h-full w-full">
      <div className="max-w-282 w-full mx-auto flex flex-col gap-6">
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
                  className="resize-none min-h-16"
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

      {/* Delete Workspace Dialog */}
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
    </main>
  );
}
