import { memo } from "react";
import hero from "@/assets/images/auth-hero.png";
import logo from "@/assets/images/logo.png";

export const AuthHeroPanel = memo(function AuthHeroPanel() {
  return (
      <div className="hidden lg:flex flex-col relative w-2/5 rounded-2xl overflow-hidden bg-secondary">
        <img
          src={hero}
          alt="Workspace Desk"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Lớp phủ nội dung trên ảnh */}
        <div className="absolute top-1/3 left-18 right-12 z-10 flex -translate-y-1/2 flex-col items-start gap-4 text-left">
            <div className="flex flex-col items-start gap-4">
                <img src={logo}
                 alt="hero"
                 className="w-16 h-auto"
                />

                <h1 className="text-3xl font-bold text-foreground">
                Folio
                </h1>
            </div>

            <div className="flex flex-col items-start gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                Documents. Organized. Collaborated.
                </h2>

                <p className="text-sm leading-relaxed text-primary-cyan">
                Where your team's documents find their safe, <br /> smart home.
                </p>
            </div>
        </div>
      </div>
  )
});