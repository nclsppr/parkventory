interface LogoProps {
  compact?: boolean;
  className?: string;
}

const logoUrl = `${import.meta.env.BASE_URL}parkventory-logo-transparent.svg`;

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <img
      alt=""
      className={className}
      draggable={false}
      height="560"
      src={logoUrl}
      width="554"
    />
  );
}

export function Logo({ compact = false, className = "" }: LogoProps) {
  return (
    <span className={`brand-lockup ${className}`.trim()}>
      <LogoMark className="brand-mark" />
      {compact
        ? <span className="sr-only">Parkventory</span>
        : <span className="brand-wordmark">Parkventory</span>}
    </span>
  );
}
