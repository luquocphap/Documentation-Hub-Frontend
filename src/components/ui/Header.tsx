import logo from "@/assets/images/logo.png";
export interface HeaderUser {
  name: string;
  email: string;
  /** URL or undefined → renders initials fallback */
  avatarUrl?: string;
}

export interface HeaderProps {
  /** Brand name shown next to the logo */
  brandName?: string;
  /** Show the search bar slot */
  showSearch?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Called when search input changes */
  onSearchChange?: (value: string) => void;
  /** Logged-in user — renders avatar + name; hides auth buttons */
  user?: HeaderUser;
  /** Called when "Sign in" is clicked (guest mode) */
  onSignIn?: () => void;
  /** Called when "Get started" is clicked (guest mode) */
  onGetStarted?: () => void;
  /** Called when the user avatar/name area is clicked */
  onUserClick?: () => void;
  /** Extra className for the <header> element */
  className?: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function BrandLogo({ name }: { name: string }) {
  return (
    <a href="/" className="flex items-center gap-2 no-underline text-foreground shrink-0">
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center"
        aria-hidden="true"
      >
        <img src={logo} 
            alt="logo"
            className="w-full h-full object-center" 
        />
      </div>
      <span className="text-lg font-semibold tracking-tight text-primary">
        {name}
      </span>
    </a>
  );
}

function SearchBar({
  placeholder,
  onChange,
}: {
  placeholder: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="relative flex-1 max-w-xs flex items-center">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-2.5 text-primary-cyan pointer-events-none"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        className="w-full h-8.5 pl-8 pr-3 border border-border rounded-lg text-[13px] bg-secondary text-foreground outline-none focus:ring-1 focus:ring-border font-body placeholder:text-primary-cyan"
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="Search"
      />
    </div>
  );
}

function UserAvatar({
  user,
  onClick,
}: {
  user: HeaderUser;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-transparent border border-border rounded-lg pl-1 pr-2.5 py-1 cursor-pointer text-foreground font-body text-[13px] font-medium hover:bg-secondary transition-colors"
      aria-label="User menu"
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-6.5 h-6.5 rounded-full object-cover"
        />
      ) : (
        <div className="w-6.5 h-6.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-semibold tracking-wide">
          {getInitials(user.name)}
        </div>
      )}
      <span>{user.name}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}



export function Header({
  brandName = "Folio",
  showSearch = false,
  searchPlaceholder = "Search…",
  onSearchChange,
  user,
  onUserClick,
  className = "",
}: HeaderProps) {
  return (
    <header
      className={`flex items-center justify-between h-13 px-6 border-b border-border bg-background sticky top-0 z-[100] gap-3 ${className}`}
    >
      <BrandLogo name={brandName} />

      {/* Center slot: search bar (optional) */}
      {showSearch && (
        <SearchBar placeholder={searchPlaceholder} onChange={onSearchChange} />
      )}

      {/* Right slot: user info OR guest auth buttons */}
      <div className="flex items-center shrink-0">
        {user && (
          <UserAvatar user={user} onClick={onUserClick} />
        )}
      </div>
    </header>
  );
}

export default Header;