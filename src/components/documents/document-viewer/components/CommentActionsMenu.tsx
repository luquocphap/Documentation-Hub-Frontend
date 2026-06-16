import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function CommentActionsMenu({
  onEdit,
  onDelete,
  disabled,
}: CommentActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Comment options"
          disabled={disabled}
          className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-39 rounded-xl shadow-lg py-2">
        <DropdownMenuItem
          className="py-1 px-1.5 gap-1.5 cursor-pointer rounded-lg text-sm font-normal"
          onClick={onEdit}
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className="py-1 px-1.5 cursor-pointer rounded-lg text-sm font-normal text-red-600 focus:text-red-600 focus:bg-red-50 transition-colors"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 gap-1.5 text-red-600" />
          Delete comment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
