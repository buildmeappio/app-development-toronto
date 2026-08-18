import Link from "next/link";
import { Baloo_2 } from "next/font/google";
import { LogoMark } from "./logo-mark";

// Rounded, chunky display face for the logo only (self-hosted, no CDN).
const brand = Baloo_2({ subsets: ["latin"], weight: ["800"] });

/** The brand wordmark — M4 leaderboard mark + two-line "toronto app dev." */
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
      <span className={`${brand.className} flex flex-col leading-[0.86] ${line}`}>
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
