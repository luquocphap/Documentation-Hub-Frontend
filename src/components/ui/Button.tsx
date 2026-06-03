import type { ButtonHTMLAttributes, ReactNode } from "react";
import React from "react";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, icon, className = "", ...props }: ButtonProps) => {
  return (
    <button
      className={`flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors ${className}`}
      {...props}
    >
      {children}
      {icon}
    </button>
  );
};