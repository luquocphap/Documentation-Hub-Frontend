import { useState, type PointerEvent } from "react";
import { ChatCircle } from "@phosphor-icons/react";
import type { FloatPosition } from "../types";

interface AddCommentButtonProps {
  position: FloatPosition;
  onClick: () => void;
}

export function AddCommentButton({ position, onClick }: AddCommentButtonProps) {
  const [hovered, setHovered] = useState(false);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  };

  return (
    <div
      style={{ position: "absolute", top: position.top, left: position.left, zIndex: 40 }}
      className="flex flex-col items-center gap-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <span
        className="flex items-center justify-center p-3 rounded-md border border-[#E5E5E5] bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ gap: 8 }}
      >
        <ChatCircle size={12} weight="fill" className="text-foreground" />
      </span>

      {hovered && (
        <div
          className="mt-1 bg-[#171717] text-white text-sm font-medium rounded-md whitespace-nowrap"
          style={{
            maxWidth: 384,
            borderRadius: "var(--border-radius-rounded-md, 6px)",
            padding: "4px 12px 6px 12px",
            gap: 8,
          }}
        >
          Add comment
        </div>
      )}
    </div>
  );
}
