import type { InputHTMLAttributes, ReactNode } from "react";
import React from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  rightIcon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, required, rightIcon, id, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-primary-cyan focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-cyan cursor-pointer">
            {rightIcon}
          </div>
        )}
      </div>
    </div>
  );
};