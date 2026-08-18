import Link from "next/link";
import { LogoMark } from "./logo-mark";

/** The brand wordmark — M4 leaderboard mark + two-line "toronto app dev."
 * (set in the site font, Geist). */
export function Wordmark({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md";
  href?: string | null;
}) {
  const line = size === "sm" ? "text-sm" : "text-xl";

  const inner = (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size === "sm" ? 34 : 44} className="shrink-0" />
      <span
        className={`flex flex-col font-extrabold leading-[0.9] tracking-tight ${line}`}
      >
        <span className="text-[#0b1b3a]">toronto</span>
        <span>
          <span className="text-[#0b1b3a]">app </span>
          <span className="text-blue-600">dev</span>
          <span className="text-amber-500">.</span>
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
