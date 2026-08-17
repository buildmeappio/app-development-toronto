import Link from "next/link";
import { Container } from "./container";
import { Wordmark } from "./wordmark";
import { HeaderAuth } from "./header-auth";
import { MobileNav } from "./mobile-nav";

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
          <Link href="/pricing" className="transition hover:text-slate-900">
            Pricing
          </Link>
        </nav>

        <div className="hidden md:block">
          <HeaderAuth />
        </div>
        <MobileNav />
      </Container>
    </header>
  );
}
