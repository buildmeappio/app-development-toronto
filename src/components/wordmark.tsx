import Link from "next/link";

/** The brand wordmark — the single source of truth for brand presentation. */
export function Wordmark({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md";
  href?: string | null;
}) {
  const mark = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  const text = size === "sm" ? "text-base" : "text-lg";

  const inner = (
    <span className="flex items-center gap-2.5">
      <span
        className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-mono font-bold text-white shadow-sm ${mark}`}
      >
        {"</>"}
      </span>
      <span className={`font-bold tracking-tight text-slate-900 ${text}`}>
        App Development <span className="text-blue-600">Toronto</span>
      </span>
    </span>
  );

  return href ? (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  ) : (
    inner
  );
}
