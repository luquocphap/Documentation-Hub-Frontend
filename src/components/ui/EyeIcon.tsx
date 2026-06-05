interface EyeIconProps {
  isVisible?: boolean;
}

export const EyeIcon = ({ isVisible = false }: EyeIconProps) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
    {isVisible && <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);
