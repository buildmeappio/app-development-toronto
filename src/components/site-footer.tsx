import Link from "next/link";
import { Container } from "./container";
import { getRegions, getLocationsBySlugs } from "@/lib/queries/locations";

const FOOTER_CITY_SLUGS = [
  "old-toronto",
  "mississauga",
  "brampton",
  "markham",
  "vaughan",
  "oakville",
];

export async function SiteFooter() {
  let regions: Awaited<ReturnType<typeof getRegions>> = [];
  let cities: Awaited<ReturnType<typeof getLocationsBySlugs>> = [];
  try {
    [regions, cities] = await Promise.all([
      getRegions(),
      getLocationsBySlugs(FOOTER_CITY_SLUGS),
    ]);
  } catch {
    // DB unavailable — render the footer without dynamic links.
  }

  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-50">
      <Container className="grid grid-cols-2 gap-8 py-14 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 font-mono text-xs font-bold text-white">
              {"</>"}
            </span>
            <span className="font-bold tracking-tight text-slate-900">
              AppDev<span className="text-blue-600">GTA</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            The curated directory of app development companies across the Greater
            Toronto Area. Ranked monthly.
          </p>
        </div>

        <FooterColumn title="Regions">
          {regions.map((r) => (
            <FooterLink key={r.id} href={`/app-development-companies/${r.fullSlug}`}>
              {r.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Popular cities">
          {cities.map((c) => (
            <FooterLink key={c.id} href={`/app-development-companies/${c.fullSlug}`}>
              {c.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Company">
          <FooterLink href="/#how">How it works</FooterLink>
          <FooterLink href="/#for-companies">For companies</FooterLink>
          <FooterLink href="/#for-companies">Claim your listing</FooterLink>
        </FooterColumn>
      </Container>

      <div className="border-t border-slate-200">
        <Container className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} AppDevGTA. All rights reserved.</p>
          <p>Business data sourced from Google. Rankings updated monthly.</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-slate-600 transition hover:text-blue-600"
      >
        {children}
      </Link>
    </li>
  );
}
