import type { InputHTMLAttributes, ReactNode } from "react";
import React from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  rightIcon?: ReactNode;
  rightIconLabel?: string;
  onRightIconClick?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required,
  rightIcon,
  rightIconLabel,
  onRightIconClick,
  id,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className={`text-sm font-medium ${error ? "text-red-500" : "text-foreground"}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-primary-cyan focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-red-500 focus:ring-red-500/20"
              : "border-border focus:ring-primary/20"
          } ${
            rightIcon ? "pr-10" : ""
          }`}
          {...props}
        />
        {rightIcon && (
          <button
            type="button"
            aria-label={rightIconLabel}
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-cyan transition-colors hover:text-foreground focus:outline-none"
          >
            {rightIcon}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-primary-cyan">
          {error}
        </p>
      )}
    </div>
  );
};
