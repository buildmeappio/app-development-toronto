import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, Panel } from "@/components/ui";
import { CopyBox } from "@/components/copy-box";
import { getCompanyBySlug } from "@/lib/queries/locations";
import { SITE_URL } from "@/lib/jsonld";

export const metadata = { title: "Your award badge", robots: { index: false } };

export default async function EmbedBadgePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ location?: string; year?: string }>;
}) {
  const { slug } = await params;
  const { location, year: y } = await searchParams;
  const year = y ?? String(new Date().getFullYear());

  const row = await getCompanyBySlug(slug).catch(() => null);
  if (!row) notFound();
  const { company } = row;

  const q = new URLSearchParams();
  if (location) q.set("location", location);
  q.set("year", year);
  const badgeUrl = `${SITE_URL}/awards/badge/${slug}?${q.toString()}`;
  const awardUrl = location
    ? `${SITE_URL}/awards/${year}/${location}`
    : `${SITE_URL}/company/${slug}`;

  const embed = `<a href="${awardUrl}" target="_blank" rel="noopener">\n  <img src="${badgeUrl}" alt="Top App Developer ${year} — Toronto App Dev" width="150" height="180" />\n</a>`;

  return (
    <PageShell width="narrow">
      <Link href={awardUrl} className="text-sm text-slate-500 hover:text-blue-600">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {company.name}&apos;s award badge
      </h1>
      <p className="mt-2 text-slate-500">
        Add this badge to your website. It links back to your ranking and shows
        visitors you&apos;re a top-rated app developer.
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-[180px_1fr] sm:items-start">
        <Panel className="flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeUrl} alt="Award badge preview" width={150} height={180} />
        </Panel>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Embed code</p>
          <CopyBox text={embed} />
          <p className="mt-4 text-xs text-slate-400">
            Paste it into your site&apos;s HTML. The badge updates automatically
            if your ranking changes.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
