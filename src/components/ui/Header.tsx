import logo from "@/assets/images/logo.png";
import { Bell, HelpCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import avatar from "@/assets/images/avatar.png";

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
  return (
    <header className={`w-full h-16 bg-white border-b border-gray-200 flex items-center px-4 ${className}`}>
      {/* KHỐI TRÁI: Logo + Brand (Chiếm đúng 20% chiều rộng) */}
      <div className="w-1/5 flex items-center pl-2 border-r border-gray-200 h-full">
        <BrandLogo name={brandName} />
      </div>

      {/* KHỐI PHẢI: Chứa Tìm kiếm và Tiện ích (Chiếm 80% chiều rộng còn lại) */}
      {showSearch && (
        <div className="w-4/5 h-full flex items-center">
        
        {/* Khối con trái: Thanh Search (Chiếm 85% của khối phải) */}
        <div className="w-[85%] h-full flex items-center border-r border-gray-200 h-full">
            <div className="w-full px-6 flex items-center gap-2 relative">
              {/* Icon Tìm kiếm (16x16) */}
              <Search size={16} />

              {/* Thẻ Input */}
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent border-none outline-none text-[14px] text-gray-700 placeholder-gray-400"
                onChange={(e) => onSearchChange?.(e.target.value)}
              />

              {/* Thẻ div chứa 2 icon hotkey (20x20) ví dụ: ⌘ + K */}
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

        {/* Khối con phải: Các Icon Thông báo, Trợ giúp, Avatar (Chiếm 15% còn lại) */}
        <div className="w-[15%] h-full flex items-center justify-end gap-3 pr-2">
          
          {/* Icon Thông báo lồng trong thẻ 32x32, icon gốc 16x16 */}
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <Bell size={12} />
          </button>

          {/* Icon Question/Help lồng trong thẻ 32x32, icon gốc 16x16 */}
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <HelpCircle size={12}/>
          </button>

          {/* Thẻ Avatar lồng trong thẻ kích thước 32x32 */}
          <button onClick={onUserClick} className="w-8 h-8 rounded-md overflow-hidden focus:outline-none shrink-0">
            <Avatar className="rounded-md">
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback
                className="rounded-md"
              >
                <img 
                  src={avatar} 
                  alt="Default Avatar" 
                  className="w-full h-full object-cover" 
                />
              </AvatarFallback>
            </Avatar>
          </button>

        </div>
      </div>
    )}
    </header>
  );
}

export default Header;