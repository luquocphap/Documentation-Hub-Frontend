import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { documentApi, type DocumentListItem } from "@/api/api";
import { toast } from "sonner";

interface DeleteDocumentModalProps {
  document: DocumentListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export function DeleteDocumentModal({ document, isOpen, onClose, onSuccess }: DeleteDocumentModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!document) return;
    
    setIsDeleting(true);
    try {
      await documentApi.delete(document.id);
      
      toast.success("Document removed successfully", {
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
      
      onSuccess(document.id);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete document.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent 
        showCloseButton={false} 
        className="flex flex-col w-[384px] max-w-[384px] min-h-41.5 bg-white border border-[#E5E5E5] rounded-[14px] p-0 overflow-hidden"
      >
        <div className="flex-1 p-4 flex flex-row gap-4 items-start w-full">
          <div className="p-4 rounded-md bg-red-100 flex items-center justify-center self-start">
            <Trash2 className="w-6 h-6 text-[#DC2626] block" />
          </div>
          
          <DialogHeader className="text-left flex-1 gap-1.5 p-0">
            <DialogTitle className="text-base font-medium text-foreground">
              Delete document?
            </DialogTitle>
            <DialogDescription className="text-sm leading-normal text-muted-foreground">
                This permanently deletes the document, including all comments and shared access.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="px-6 py-4 flex items-center justify-end gap-2 bg-gray-50/50 border-t border-border mt-auto">
          <Button variant="outline" onClick={onClose} disabled={isDeleting} className="bg-white">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}