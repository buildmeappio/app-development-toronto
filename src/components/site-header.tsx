import Link from "next/link";
import { Container } from "./container";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Wordmark />

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#regions" className="transition hover:text-slate-900">
            Regions
          </Link>
          <Link href="/#how" className="transition hover:text-slate-900">
            How it works
          </Link>
          <Link href="/#for-companies" className="transition hover:text-slate-900">
            For companies
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/#for-companies"
            className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-block"
          >
            Claim your listing
          </Link>
        </div>
      </Container>
    </header>
  );
}
