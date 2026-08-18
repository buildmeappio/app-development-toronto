import Link from "next/link";
import { LogoMark } from "./logo-mark";

/** The brand wordmark — the single source of truth for brand presentation.
 * Leaderboard mark + "tad." monogram over the full name (W3). */
export function Wordmark({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md";
  href?: string | null;
}) {
  const mono = size === "sm" ? "text-sm" : "text-lg";
  const sub = size === "sm" ? "text-[7px]" : "text-[8px]";

  const inner = (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size === "sm" ? 28 : 34} className="shrink-0" />
      <span className="flex flex-col justify-center leading-none">
        <span className={`font-extrabold tracking-tight text-slate-900 ${mono}`}>
          tad<span className="text-amber-500">.</span>
        </span>
        <span
          className={`mt-1 font-semibold uppercase tracking-[0.16em] text-slate-400 ${sub}`}
        >
          Toronto App Developers
        </span>
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
