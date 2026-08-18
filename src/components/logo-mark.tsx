/** The brand mark — a gradient app tile with a code glyph. Matches the favicon. */
export function LogoMark({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id="logoMarkGradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logoMarkGradient)" />
      <g
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <polyline points="12,11 8,16 12,21" />
        <polyline points="20,11 24,16 20,21" />
        <line x1="18" y1="9.5" x2="14" y2="22.5" />
      </g>
    </svg>
  );
}
