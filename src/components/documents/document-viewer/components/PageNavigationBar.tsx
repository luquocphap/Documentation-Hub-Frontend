import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PageNavigationBarProps {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function PageNavigationBar({
  currentPage,
  totalPages,
  isLoading,
  onPageChange,
}: PageNavigationBarProps) {
  const isPreviousDisabled = isLoading || currentPage <= 1;
  const isNextDisabled = isLoading || currentPage >= totalPages;

  return (
    <div className="shrink-0 h-12 flex items-center justify-center gap-2 border-t border-[#E5E5E5] bg-white px-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(1)}
        className="h-8 w-8 p-0"
        disabled={isPreviousDisabled}
      >
        <ChevronsLeft size={14} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        className="h-8 w-8 p-0"
        disabled={isPreviousDisabled}
      >
        <ChevronLeft size={14} />
      </Button>
      <input
        type="number"
        min={1}
        max={totalPages}
        value={currentPage}
        onChange={(e) => onPageChange(Number(e.target.value))}
        className="h-8 w-10 text-center text-sm font-medium text-foreground border border-[#E5E5E5] rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-sm text-muted-foreground select-none">/ {totalPages}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        className="h-8 w-8"
        disabled={isNextDisabled}
      >
        <ChevronRight size={14} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        className="h-8 w-8"
        disabled={isNextDisabled}
      >
        <ChevronsRight size={14} />
      </Button>
    </div>
  );
}
