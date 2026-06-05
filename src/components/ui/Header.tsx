import logo from "@/assets/images/logo.png";

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
      <div className="w-1/5 flex items-center pl-2">
        <BrandLogo name={brandName} />
      </div>

      {/* KHỐI PHẢI: Chứa Tìm kiếm và Tiện ích (Chiếm 80% chiều rộng còn lại) */}
      {showSearch && (
        <div className="w-4/5 h-full flex items-center">
        
        {/* Khối con trái: Thanh Search (Chiếm 85% của khối phải) */}
        <div className="w-[85%] h-full flex items-center">
            <div className="w-full px-6 flex items-center gap-2 relative">
              {/* Icon Tìm kiếm (16x16) */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-400 shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          {/* Icon Question/Help lồng trong thẻ 32x32, icon gốc 16x16 */}
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          {/* Thẻ Avatar lồng trong thẻ kích thước 32x32 */}
          <button onClick={onUserClick} className="w-8 h-8 rounded-full overflow-hidden focus:outline-none shrink-0">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || "User Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              // Fallback tạm thời nếu không có avatarUrl
              <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </button>

        </div>
      </div>
    )}
    </header>
  );
}

export default Header;