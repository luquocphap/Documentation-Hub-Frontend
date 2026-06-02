import type { ButtonHTMLAttributes } from "react";
import React from "react";

export const Button: React.FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = "", ...props }) => {
  return (
    <button
      className={`w-full bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};