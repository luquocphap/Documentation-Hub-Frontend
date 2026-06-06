import * as React from "react"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ label, error, required, rightIcon, onRightIconClick, id, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Label từ shadcn */}
        <Label htmlFor={id} className={error ? "text-red-500" : "text-foreground"}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        
        <div className="relative">
          {/* Input từ shadcn */}
          <Input
            id={id}
            ref={ref}
            aria-invalid={Boolean(error)}
            className={cn(
              error ? "border-red-500 focus-visible:ring-red-500" : "",
              className
            )}
            {...props}
          />
          
          {/* Nút chứa Icon bên phải (như ẩn/hiện mật khẩu) */}
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            >
              {rightIcon}
            </button>
          )}
        </div>
        
        {/* Dòng hiển thị lỗi */}
        {error && (
          <p className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    )
  }
)
CustomInput.displayName = "CustomInput"