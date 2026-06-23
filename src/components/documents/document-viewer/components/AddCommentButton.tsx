import type { PointerEvent } from "react";
import { ChatCircle } from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FloatPosition } from "../types";

interface AddCommentButtonProps {
  position: FloatPosition;
  onClick: () => void;
}

export function AddCommentButton({ position, onClick }: AddCommentButtonProps) {
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  };

  return (
    <div
      style={{ position: "absolute", top: position.top, left: position.left, zIndex: 40 }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              aria-label="Add comment"
              className="flex items-center justify-center p-3 rounded-md border border-[#E5E5E5] bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
              onPointerDown={handlePointerDown}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <ChatCircle size={12} weight="fill" className="text-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="center"
            sideOffset={6}
            className="max-w-sm whitespace-nowrap rounded-md py-1.5 px-3 bg-[#171717] text-sm font-medium leading-normal text-white shadow-lg [&_svg]:bg-[#171717] [&_svg]:fill-[#171717]"
          >
            Add comment
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
