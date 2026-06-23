import { useEffect, useRef, type KeyboardEvent } from "react";
import { ArrowUp } from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import type { FloatPosition } from "../types";

interface CommentInputBoxProps {
  position: FloatPosition;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function CommentInputBox({
  position,
  value,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
}: CommentInputBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
    if (event.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 1000,
        width: 264,
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <div
        className="bg-white border border-ring rounded-lg flex items-center"
        style={{
          padding: "4px 10px",
          gap: 6,
          boxShadow: "0px 0px 0px 3px var(--customoutline)",
        }}
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment"
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground min-w-0"
          disabled={isSubmitting}
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim() || isSubmitting}
          className="shrink-0 w-6 h-6 bg-[#171717] disabled:bg-[#E5E5E5] rounded-md flex items-center justify-center transition-colors"
          style={{ gap: 8, borderRadius: "var(--border-radius-rounded-md, 6px)" }}
        >
          {isSubmitting
            ? <Loader2 size={12} className="text-white animate-spin" />
            : <ArrowUp size={12} weight="bold" className="text-white" />
          }
        </button>
      </div>
    </div>
  );
}
