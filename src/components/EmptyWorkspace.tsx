import { useRef, useState, type DragEvent, type KeyboardEvent } from "react"
import { Type } from "lucide-react"
import { Button } from "./ui/Button"
import emptyIllustration from "@/assets/images/empty-folder.png";

interface EmptyWorkspaceProps {
  onUploadClick: () => void;
  onFileDrop: (file: File) => void;
  setIsMdModalOpen: (isOpen: boolean) => void;
}

const EmptyWorkspace = ({ onUploadClick, onFileDrop, setIsMdModalOpen }: EmptyWorkspaceProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);

    if (dragDepth.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileDrop(file);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onUploadClick();
    }
  };

  return (
    <div className="flex flex-col flex-1">
        <div className="w-full flex flex-col gap-8 mx-auto">
            
            {/* THẺ TRÊN: Khu vực upload (Dashed border) */}
            <div
                role="button"
                tabIndex={0}
                aria-label="Upload a PDF document"
                onClick={onUploadClick}
                onKeyDown={handleKeyDown}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full rounded-lg flex flex-col items-center justify-center gap-2.5 py-6 px-3 cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isDragging ? "bg-primary-cyan/10" : "bg-card/50 hover:bg-muted/50"
                }`}
            >

                <svg
                    className="pointer-events-none absolute inset-0 size-full text-border"
                    aria-hidden="true"
                >
                    <rect
                    x="0.5"
                    y="0.5"
                    width="calc(100% - 1px)"
                    height="calc(100% - 1px)"
                    rx="8"
                    fill="none"
                    stroke={isDragging ? "currentColor" : "#64748B"}
                    strokeWidth="1"
                    strokeDasharray="6 6"
                    />
                </svg>

                <img 
                    src={emptyIllustration} 
                    alt="Upload illustration" 
                    className="w-75 h-auto mb-4 opacity-80" 
                />
                
                <div className="text-center flex flex-col gap-1.5">
                    <h3 className="text-sm font-semibold text-foreground">Upload your first document</h3>
                    <p className="text-sm text-muted-foreground">
                        Drag & drop or click to upload a PDF (max 20MB).
                    </p>
                </div>
            </div>

            {/* THẺ DƯỚI: Nút tạo mới (Center Content) */}
            <div className="mx-auto flex flex-col items-center justify-center gap-3">
                <span className="text-sm text-muted-foreground">or start from scratch</span>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full gap-2 text-foreground font-medium shadow-sm"
                    onClick={() => setIsMdModalOpen(true)}
                >
                    <Type className="w-4 h-4 text-muted-foreground" /> New blank document
                </Button>
            </div>

        </div>
    </div>
  )
}

export default EmptyWorkspace
