import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DiscardDialogProps {
  open: boolean;
  isDiscarding: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => Promise<void> | void;
}

export function DiscardDialog({
  open,
  isDiscarding,
  onOpenChange,
  onDiscard,
}: DiscardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col w-[384px] max-w-[384px] min-h-41.5 bg-white border border-[#E5E5E5] rounded-[14px] p-0 overflow-hidden"
      >
        <div className="flex-1 px-6 pt-6 pb-4 flex flex-row gap-4 items-start w-full">
          <div className="p-4 rounded-md bg-red-100 flex items-center justify-center self-start">
            <WarningCircle className="w-6 h-6 text-[#DC2626] block" />
          </div>
          <DialogHeader className="text-left flex-1 gap-1 p-0">
            <DialogTitle className="text-base font-medium text-foreground">
              Discard unsaved changes?
            </DialogTitle>
            <DialogDescription className="text-sm font-normal leading-normal text-muted-foreground">
              You have unsaved changes. Leaving now will discard them. Leave anyway?
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-4 flex items-center justify-end gap-2 bg-gray-50/50 border-t border-border mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-white">
            Keep editing
          </Button>
          <Button variant="destructive" onClick={onDiscard} disabled={isDiscarding}>
            {isDiscarding ? "Discarding..." : "Discard"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
