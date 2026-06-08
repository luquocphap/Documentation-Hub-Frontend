import { useState, FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { workspaceApi } from "@/api/api";
import { CircleAlert } from "lucide-react";
import { CustomInput } from "./CustomInput";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [backendError, setBackendError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thêm state isTouched
  const [isTouched, setIsTouched] = useState(false);

  let nameError = "";
  if (isTouched && name.trim().length === 0) {
    nameError = "Workspace name is required.";
  } else if (name.length > 60) {
    nameError = "Workspace name must be 60 characters or fewer.";
  }
  const isFormValid = name.trim().length > 0 && name.length <= 60;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBackendError("");

    // Phòng hờ trường hợp user cố tình lách luật (VD: sửa DOM bằng devtool)
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await workspaceApi.create({ name: name.trim(), description: description.trim() });
      
      setName("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err: any) {
      // Chỉ hiện lỗi chung nếu server báo về (VD: "Tên đã tồn tại")
      setBackendError(err.response?.data?.message || "Failed to create workspace. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setDescription("");
      setBackendError("");
      setIsTouched(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden bg-background">
        <form onSubmit={handleSubmit} className="flex flex-col w-full">
          
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold text-foreground">Create Workspace</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-6 flex flex-col gap-4">
            {backendError && (
              <div className="flex items-center gap-1.5 text-sm text-red-500 bg-red-50 p-2.5 rounded-md border border-red-200">
                <CircleAlert size={16} /> {backendError}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <CustomInput
                id="workspace-name"
                label="Workspace name"
                placeholder="e.g Marketing Team"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setBackendError(""); 
                }}
                onBlur={() => setIsTouched(true)}
                disabled={isSubmitting}
                error={nameError}
                required
              />
              
              <span className={`text-[11px] text-right mt-1 ${name.length > 60 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                {name.length}/60
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="workspace-desc" className="text-sm font-medium text-foreground">
                Description (optional)
              </label>
              <Textarea
                id="workspace-desc"
                placeholder="What is this Workspace for?"
                className="resize-none min-h-16"
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
            
            {/* 3. Truyền biến !isFormValid vào disabled */}
            <Button type="submit" disabled={isSubmitting || !isFormValid}>
              {isSubmitting ? "Creating..." : "Create Workspace"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}