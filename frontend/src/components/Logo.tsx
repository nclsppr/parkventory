interface LogoProps {
  compact?: boolean;
  className?: string;
}

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 64 64"
      fill="none"
    >
      <path
        d="M11 51V12h21c11 0 18 6.5 18 16.5S43 45 32 45h-9v7"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="29" y="35" width="8" height="8" rx="1.6" fill="currentColor" />
      <rect x="41" y="35" width="8" height="8" rx="1.6" className="logo-cyan" />
      <rect x="29" y="47" width="8" height="8" rx="1.6" fill="currentColor" />
      <rect x="41" y="47" width="8" height="8" rx="1.6" fill="currentColor" />
    </svg>
  );
}

export function Logo({ compact = false, className = "" }: LogoProps) {
  return (
    <span className={`brand-lockup ${className}`.trim()} aria-label="Parkventory">
      <LogoMark className="brand-mark" />
      {!compact && <span className="brand-wordmark">Parkventory</span>}
    </span>
  );
}
