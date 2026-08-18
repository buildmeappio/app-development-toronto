import Link from "next/link";
import { LogoMark } from "./logo-mark";

/** The brand wordmark — the single source of truth for brand presentation. */
export function Wordmark({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md";
  href?: string | null;
}) {
  const text = size === "sm" ? "text-base" : "text-lg";

  const inner = (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size === "sm" ? 30 : 36} className="shrink-0 rounded-xl shadow-sm" />
      <span className={`font-bold tracking-tight text-slate-900 ${text}`}>
        Toronto <span className="text-blue-600">App Developers</span>
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
