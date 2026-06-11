import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { X } from "lucide-react";
import { documentApi, type DocumentListItem } from "@/api/api";
import { toast } from "sonner";

interface RenameDocumentModalProps {
  document: DocumentListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id: string, newTitle: string, updatedAt: string) => void;
}

export function RenameDocumentModal({ document, isOpen, onClose, onSuccess }: RenameDocumentModalProps) {
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Khởi tạo tên khi mở modal
  useEffect(() => {
    if (document && isOpen) {
      setNewName(document.title);
    } else {
      setNewName("");
    }
  }, [document, isOpen]);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !newName.trim() || newName.trim() === document.title) return;

    setIsRenaming(true);
    try {
      await documentApi.update(document.id, { title: newName.trim() });
      
      toast.success("Document renamed successfully", {
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
      
      onSuccess(document.id, newName.trim(), new Date().toISOString());
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to rename document.");
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isRenaming && onClose()}>
      <DialogContent 
        showCloseButton={false} 
        className="sm:max-w-106.25 h-44 p-0 gap-0 overflow-hidden bg-white border border-[#E5E5E5] rounded-[14px] flex flex-col"
      >
        <form onSubmit={handleRename} className="flex flex-col h-full w-full">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-[18px] font-semibold text-foreground text-left">
              Rename document
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-2 flex-1 flex items-center">
            <div className="relative w-full">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="pr-8 h-10 border-[#E5E5E5] focus-visible:ring-ring/50" 
                autoFocus
                onFocus={(e) => {
                  const length = e.currentTarget.value.length;
                  e.currentTarget.setSelectionRange(length, length);
                }}
              />
              {newName && (
                <button
                  type="button"
                  onClick={() => setNewName("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground outline-none"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 flex justify-end gap-2 mt-auto">
            <Button type="button" variant="outline" onClick={onClose} disabled={isRenaming} className="bg-white">
              Cancel
            </Button>
            <Button type="submit" disabled={isRenaming || !newName.trim() || newName.trim() === document?.title}>
              {isRenaming ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}