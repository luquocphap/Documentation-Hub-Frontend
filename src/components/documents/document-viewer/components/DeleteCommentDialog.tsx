import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface DeleteCommentDialogProps {
  open: boolean;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void> | void;
}

export function DeleteCommentDialog({
  open,
  isDeleting,
  onOpenChange,
  onDelete,
}: DeleteCommentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col w-[384px] max-w-[384px] min-h-41.5 bg-white border border-[#E5E5E5] rounded-[14px] p-0 overflow-hidden"
      >
        <div className="flex-1 p-4 flex flex-row gap-4 items-start w-full">
          <div className="p-2 rounded-md bg-red-100 flex items-center justify-center self-start">
            <Trash2 className="w-6 h-6 text-[#DC2626] block" />
          </div>
          <DialogHeader className="text-left flex-1 gap-1 p-0">
            <DialogTitle className="text-base font-medium text-foreground">
              Delete thread?
            </DialogTitle>
            <DialogDescription className="text-sm font-normal leading-normal text-muted-foreground">
              Are you sure you want to delete this thread? This will delete any replies as well.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-4 flex items-center justify-end gap-2 bg-gray-50/50 border-t border-border mt-auto">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white py-2 px-2.5"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button variant="destructive" className="py-2 px-2.5" onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
