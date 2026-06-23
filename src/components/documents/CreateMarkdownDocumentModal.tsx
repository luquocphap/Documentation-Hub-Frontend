import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Maximize2, X, Bold, Italic, Underline, Strikethrough, List, ListOrdered, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { documentApi } from "@/api/api";
import { toast } from "sonner";

interface MarkdownToolbarAction {
  icon: LucideIcon;
  tooltip: string;
  prefix: string;
  suffix: string;
  shortcutKey: string | null;
}

const TOOLBAR_ACTIONS: MarkdownToolbarAction[] = [
  { icon: Bold, tooltip: 'Bold (Cmd/Ctrl + B)', prefix: '**', suffix: '**', shortcutKey: 'b' },
  { icon: Italic, tooltip: 'Italic (Cmd/Ctrl + I)', prefix: '_', suffix: '_', shortcutKey: 'i' },
  { icon: Underline, tooltip: 'Underline (Cmd/Ctrl + U)', prefix: '<u>', suffix: '</u>', shortcutKey: 'u' },
  { icon: Strikethrough, tooltip: 'Strikethrough', prefix: '~~', suffix: '~~', shortcutKey: null },
  { icon: List, tooltip: 'Bulleted list', prefix: '- ', suffix: '', shortcutKey: null },
  { icon: ListOrdered, tooltip: 'Numbered list', prefix: '1. ', suffix: '', shortcutKey: null },
];

interface MarkdownToolbarActionButtonProps {
  action: MarkdownToolbarAction;
  onApply: (prefix: string, suffix: string) => void;
}

function MarkdownToolbarActionButton({
  action,
  onApply,
}: MarkdownToolbarActionButtonProps) {
  const Icon = action.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={action.tooltip}
          className="text-muted-foreground hover:bg-gray-200 hover:text-foreground"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onApply(action.prefix, action.suffix)}
        >
          <Icon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="center"
        sideOffset={6}
        className="whitespace-nowrap rounded-md bg-[#171717] px-3 py-1.5 text-xs font-normal text-white shadow-md [&_svg]:bg-[#171717] [&_svg]:fill-[#171717]"
      >
        {action.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

interface CreateMarkdownDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onSuccess: () => void;
}

export function CreateMarkdownDocumentModal({ isOpen, onClose, workspaceId, onSuccess }: CreateMarkdownDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  
  // Dùng useRef để điều khiển con trỏ của Textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setContent("");
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  const isTitleEmpty = title.trim().length === 0;
  const isTitleTooLong = title.length > 255;
  const isContentTooLong = content.length > 50000;
  const showTitleError = hasAttemptedSubmit && isTitleEmpty;
  const titleErrorMsg = showTitleError ? "Document name is required" : "";

  // --- HÀM XỬ LÝ CHÈN MARKDOWN & ĐẶT LẠI CON TRỎ ---
  const applyMarkdown = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Lấy vị trí bắt đầu và kết thúc của vùng đang bôi đen (hoặc vị trí con trỏ hiện tại)
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    // Chèn ký tự vào giữa nội dung cũ
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newContent);

    // Dùng setTimeout để đợi React cập nhật state 'content' xong mới set lại vị trí chuột
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        // Nếu có bôi đen chữ trước đó -> bôi đen lại toàn bộ vùng đã thêm markdown
        textarea.setSelectionRange(start, start + prefix.length + selectedText.length + suffix.length);
      } else {
        // Nếu không có chữ -> đặt con trỏ vào ngay giữa prefix và suffix
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  };

  // --- HÀM BẮT SỰ KIỆN PHÍM TẮT ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Kiểm tra nếu người dùng nhấn Ctrl (Windows) hoặc Cmd (Mac)
    if (e.ctrlKey || e.metaKey) {
      const action = TOOLBAR_ACTIONS.find(a => a.shortcutKey === e.key.toLowerCase());
      if (action) {
        e.preventDefault(); // Chặn hành vi mặc định của trình duyệt (ví dụ Ctrl+B mở Bookmark)
        applyMarkdown(action.prefix, action.suffix);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (isTitleEmpty || isTitleTooLong || isContentTooLong) return;

    setIsSubmitting(true);
    try {
      await documentApi.createFromMarkdown({
        workspaceId,
        title: title.trim(),
        markdownContent: content,
      });

      toast.success("Document created successfully", {
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

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent 
        showCloseButton={false} 
        className="min-w-264 h-152.5 p-0 flex flex-col bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-xl"
      >
        <DialogHeader className="w-full h-18 shrink-0 pt-6 pr-6 pb-5 pl-6 flex flex-row items-center justify-between border-b border-transparent">
          <DialogTitle className="text-[18px] font-semibold text-foreground m-0">
            New document
          </DialogTitle>
          <div className="flex items-center gap-3 text-muted-foreground">
            <button className="hover:text-foreground outline-none"><Maximize2 size={16} /></button>
            <button onClick={onClose} className="hover:text-foreground outline-none"><X size={20} /></button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-6 pb-6 w-full gap-2 min-h-0">
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            
            <div className="shrink-0 flex flex-col gap-1.5 w-full">
              <label className="text-[13px] font-semibold text-foreground">Title</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title..."
                className={`h-8 rounded-lg px-2.5 py-1 text-sm transition-all
                  ${(showTitleError || isTitleTooLong) 
                    ? 'border-red-500 focus-visible:ring-red-500/20' 
                    : 'border-[#E5E5E5] focus-visible:ring-ring/50'
                  }
                `}
                autoFocus
              />
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-[11px] text-red-500 font-medium">
                  {titleErrorMsg}
                </span>
                <span className={`text-[11px] ${isTitleTooLong ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                  {title.length}/255 characters
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 w-full min-h-0">
              <div className={`flex-1 flex flex-col rounded-lg border transition-all overflow-hidden min-h-0 relative
                ${isContentTooLong 
                  ? 'border-red-500 ring-4 ring-red-500/10'
                  : 'border-[#E5E5E5] focus-within:ring-4 focus-within:ring-ring/20'
                }
              `}>
                
                {/* TOOLBAR */}
                <TooltipProvider>
                  <div
                    role="toolbar"
                    aria-label="Markdown formatting"
                    className="h-10 shrink-0 border-b border-[#E5E5E5] bg-gray-50/50 flex items-center px-2 gap-1 relative z-10"
                  >
                    {TOOLBAR_ACTIONS.map((action) => (
                      <MarkdownToolbarActionButton
                        key={action.tooltip}
                        action={action}
                        onApply={applyMarkdown}
                      />
                    ))}
                  </div>
                </TooltipProvider>

                {/* TEXTAREA NHẬP MD */}
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your content here using Markdown..."
                  className="flex-1 w-full h-full resize-none overflow-y-auto outline-none p-2.5 text-sm text-foreground bg-transparent border-0 focus-visible:ring-0 rounded-none shadow-none"
                />
              </div>

              <div className="shrink-0 flex justify-end mt-0.5">
                <span className={`text-[11px] ${isContentTooLong ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                  {content.length.toLocaleString()}/50,000 characters
                </span>
              </div>
            </div>

          </div>

          <div className="shrink-0 flex justify-end gap-2 pt-2 mt-auto">
            <Button 
              type="button" variant="outline" 
              onClick={onClose} disabled={isSubmitting}
              className="bg-white px-4 h-9"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isTitleTooLong || isContentTooLong}
              className="px-4 h-9 gap-2"
            >
              {isSubmitting ? "Creating..." : (
                <>
                  <FileText size={16} /> Create PDF
                </>
              )}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
