import { useState, FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { workspaceApi } from "@/api/api";
import { CircleAlert } from "lucide-react";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Workspace name is required.");
      return;
    }
    if (trimmedName.length > 60) {
      setError("Workspace name must not exceed 60 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await workspaceApi.create({ name: trimmedName, description: description.trim() });
      
      setName("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create workspace. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setDescription("");
      setError("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* p-0 xóa padding mặc định, overflow-hidden đảm bảo các thẻ con không bị tràn góc bo */}
      <DialogContent className="sm:max-w-106.25 p-0 gap-0 overflow-hidden bg-background">
        
        {/* Thẻ form bao trọn TOÀN BỘ nội dung Modal (100% chiều rộng và chiều cao) */}
        <form onSubmit={handleSubmit} className="flex flex-col w-full">
          
          {/* HEADER */}
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold text-foreground">Create Workspace</DialogTitle>
          </DialogHeader>

          {/* BODY */}
          <div className="px-6 py-6 flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-1.5 text-sm text-red-500 bg-red-50 p-2.5 rounded-md border border-red-200">
                <CircleAlert size={16} /> {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="workspace-name" className="text-sm font-medium text-foreground">
                Workspace name <span className="text-red-500">*</span>
              </label>
              <Input
                id="workspace-name"
                placeholder="e.g Marketing Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className={error && name.length > 60 ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="workspace-desc" className="text-sm font-medium text-foreground">
                Description (optional)
              </label>
              <Textarea
                id="workspace-desc"
                placeholder="What is this Workspace for?"
                className="resize-none h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="px-6 py-5 border-t border-border bg-gray-50/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Workspace"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}