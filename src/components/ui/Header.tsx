import logo from "@/assets/images/logo.png";
import { Bell, HelpCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import avatar from "@/assets/images/avatar.png";
import { useState } from "react";
import { SearchDocumentsModal } from "../SearchDocumentModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { SignOutIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export interface HeaderUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface HeaderProps {
  brandName?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  user?: HeaderUser;
  onUserClick?: () => void;
  className?: string;
}

function BrandLogo({ name }: { name: string }) {
  return (
    <a href="/" className="flex items-center gap-2 no-underline shrink-0">
      <div className="w-8 h-8 rounded-md flex items-center justify-center" aria-hidden="true">
        <img src={logo} alt="logo" className="w-full h-full object-center" />
      </div>
      <span className="text-lg font-semibold tracking-tight text-primary">
        {name}
      </span>
    </a>
  );
}

export function Header({
  brandName = "Folio",
  showSearch = true,
  searchPlaceholder = "Search documents across all Workspaces...",
  onSearchChange,
  user,
  onUserClick,
  className = "",
}: HeaderProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className={`w-full h-16 bg-white border-b border-gray-200 flex items-center ${className}`}>
      {/* Khối Logo: Giữ w-64 và thêm shrink-0 */}
      <div className="w-64 shrink-0 flex items-center border-r border-gray-200 h-full py-2 px-4">
        <BrandLogo name={brandName} />
      </div>

      {showSearch && (
        // Khối chứa Search và Icon: Dùng flex-1 để tự động chiếm toàn bộ không gian còn lại
        <div className="flex-1 flex items-center h-full min-w-0">
        
          {/* Khối Search: Dùng flex-1 để tự co giãn */}
          <div className="flex-1 h-full flex items-center border-r border-gray-200 min-w-0">
            <div className="w-full px-6 flex items-center gap-2 relative">
              <Search size={16} className="text-gray-500 shrink-0" />

              <input
                type="text"
                placeholder={searchPlaceholder}
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-[14px] text-gray-700 placeholder-gray-400"
                onChange={(e) => onSearchChange?.(e.target.value)}
                onClick={() => setIsSearchModalOpen(true)}
              />

              <div className="flex items-center gap-1 shrink-0 text-gray-400">
                <div className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-[11px] font-medium">
                  ⌘
                </div>
                <div className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-[11px] font-medium">
                  K
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 h-full flex items-center justify-end gap-4 px-6">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
              <Bell size={16} /> 
            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
              <HelpCircle size={16}/>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild >
                <button className="w-8 h-8 rounded-md overflow-hidden focus:outline-none shrink-0">
                  <Avatar className="rounded-md">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                    <AvatarFallback className="rounded-md">
                      <img
                        src={avatar}
                        alt="Default Avatar"
                        className="w-full h-full object-cover"
                      />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg p-1">
                <DropdownMenuItem
                  className="p-2 cursor-pointer rounded-lg text-sm font-medium"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                >
                  <SignOutIcon className="w-3 h-3" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {isSearchModalOpen && 
        <SearchDocumentsModal open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen} />
      }
    </header>
  );
}

export default Header;
