import type { ReactNode } from "react";

type Variant = "neutral" | "sponsored" | "verified" | "success";

const VARIANTS: Record<Variant, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  sponsored: "bg-amber-50 text-amber-700 ring-amber-200",
  verified: "bg-blue-50 text-blue-700 ring-blue-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Ranking position badge — medal colors for the top 3. */
export function RankBadge({ rank }: { rank: number }) {
  const style =
    rank === 1
      ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 ring-amber-300"
      : rank === 2
        ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 ring-slate-300"
        : rank === 3
          ? "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950 ring-orange-300"
          : "bg-slate-50 text-slate-500 ring-slate-200";
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ring-1 ring-inset ${style}`}
    >
      {rank}
    </div>
  );
}
