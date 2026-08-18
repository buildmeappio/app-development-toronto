/** The brand mark — a "leaderboard": stacked rows with the top (featured) row
 * lit. Bare version for the on-page logo; the favicon adds a chip. */
export function LogoMark({
  size = 34,
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
      {/* top row = the featured/#1 listing */}
      <rect x="6" y="7" width="20" height="5" rx="2.5" fill="#F59E0B" />
      <rect x="6" y="14" width="14" height="5" rx="2.5" fill="#2563EB" />
      <rect x="6" y="21" width="14" height="5" rx="2.5" fill="#2563EB" />
    </svg>
  );
}
