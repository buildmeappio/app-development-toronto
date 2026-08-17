/** Read-only star rating with fractional fill, rendered without client JS. */
export function StarRating({
  rating,
  count,
  size = "sm",
}: {
  rating?: number | null;
  count?: number | null;
  size?: "sm" | "md";
}) {
  const pct = Math.max(0, Math.min(100, ((rating ?? 0) / 5) * 100));
  const text = size === "md" ? "text-base" : "text-sm";
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`relative inline-block whitespace-nowrap leading-none tracking-wide ${text}`}
        aria-label={rating != null ? `${rating} out of 5 stars` : "No rating"}
      >
        <span className="text-slate-200">★★★★★</span>
        <span
          className="absolute inset-0 overflow-hidden text-amber-400"
          style={{ width: `${pct}%` }}
        >
          ★★★★★
        </span>
      </div>
      {rating != null && (
        <span className="text-sm font-semibold text-slate-700">
          {rating.toFixed(1)}
        </span>
      )}
      {count != null && (
        <span className="text-sm text-slate-400">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
