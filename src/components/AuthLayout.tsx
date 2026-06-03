import type{ ReactNode } from "react";
import React from "react";
import { AuthHeroPanel } from "./ui/AuthHeroPanel";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex bg-background p-4">
      
      <AuthHeroPanel />

      {/* Cột phải: Nội dung Form (Login/Register) */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-100">
          {children}
        </div>
      </div>
    </div>
  );
};