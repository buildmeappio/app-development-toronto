// Env loaded via `tsx --env-file=.env.local` (see package.json curate:ingest).
import { db } from "./index";
import { locations, companies, companyLocations } from "./schema";
import { eq, inArray } from "drizzle-orm";
import { searchText, type PlaceResult } from "../lib/places";
import { extractDomain } from "../lib/slug";
import {
  assessPlace,
  cleanName,
  slugBase,
  cityFromAddress,
} from "../lib/curation";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Scale knobs: multiple query angles per city, paginated.
const QUERY_TEMPLATES = [
  "app development company in {loc}, Ontario, Canada",
  "mobile app developers in {loc}, Ontario, Canada",
  "software development company in {loc}, Ontario, Canada",
];
const MAX_PAGES = 2; // up to ~40 results per query

const HQ_WEIGHT = 1;
const SERVES_WEIGHT = 0.5;

async function ingest() {
  const leafLocations = await db
    .select()
    .from(locations)
    .where(inArray(locations.type, ["city", "district"]));

  const allLocations = await db.select().from(locations);
  const byName = new Map<string, (typeof allLocations)[number]>();
  for (const l of allLocations) byName.set(l.name.toLowerCase(), l);
  // Addresses that say just "Toronto, ON" map to the downtown core district.
  const downtown = allLocations.find((l) => l.slug === "downtown-toronto");
  if (downtown) byName.set("toronto", downtown);

  const resolveLocation = (
    address: string | undefined,
    fallback: (typeof allLocations)[number],
  ) => {
    const city = cityFromAddress(address);
    return (city && byName.get(city)) || fallback;
  };

  const seen = new Set<string>();
  const stats = { inserted: 0, updated: 0, skippedIrrelevant: 0, skippedBare: 0, unpublished: 0, links: 0 };

  /** Upsert a company + its location links. */
  async function processPlace(place: PlaceResult, queriedLoc: (typeof allLocations)[number]) {
    if (!place.displayName?.text) return;
    if (place.businessStatus === "CLOSED_PERMANENTLY") return;

    const verdict = assessPlace(place);
    const publishable = verdict.relevant && !verdict.bare;
    const name = cleanName(place.displayName.text);
    const hqLocation = resolveLocation(place.formattedAddress, queriedLoc);
    const domain = extractDomain(place.websiteUri);

    // Company identity is the DOMAIN (one company per firm, multiple offices).
    // Fall back to place_id only when there's no website/domain.
    let existing: { id: string; isPublished: boolean; googleRatingCount: number | null } | undefined;
    if (domain) {
      [existing] = await db
        .select({ id: companies.id, isPublished: companies.isPublished, googleRatingCount: companies.googleRatingCount })
        .from(companies)
        .where(eq(companies.domain, domain))
        .limit(1);
    }
    if (!existing) {
      [existing] = await db
        .select({ id: companies.id, isPublished: companies.isPublished, googleRatingCount: companies.googleRatingCount })
        .from(companies)
        .where(eq(companies.googlePlaceId, place.id))
        .limit(1);
    }

    let companyId: string;
    if (existing) {
      // Promote this listing's figures to represent the company only if it's the
      // most-reviewed office we've seen (keeps the strongest rating).
      const thisCount = place.userRatingCount ?? 0;
      const promote = thisCount >= (existing.googleRatingCount ?? 0);
      const set: Record<string, unknown> = {
        website: place.websiteUri ?? undefined,
        domain: domain ?? undefined,
        isPublished: existing.isPublished || publishable,
        updatedAt: new Date(),
      };
      if (promote) {
        set.name = name;
        set.googlePlaceId = place.id;
        set.googleRating = place.rating ?? null;
        set.googleRatingCount = place.userRatingCount ?? null;
        set.addressText = place.formattedAddress ?? null;
        set.lat = place.location?.latitude ?? null;
        set.lng = place.location?.longitude ?? null;
        set.primaryLocationId = hqLocation.id;
      }
      await db.update(companies).set(set).where(eq(companies.id, existing.id));
      companyId = existing.id;
      if (!seen.has(place.id)) stats.updated++;
    } else {
      // New + not publishable → skip entirely (don't pollute the directory).
      if (!publishable) {
        if (!seen.has(place.id)) {
          if (!verdict.relevant) stats.skippedIrrelevant++;
          else stats.skippedBare++;
        }
        seen.add(place.id);
        return;
      }
      // Clean name-only slug; numeric suffix only on a genuine collision.
      const base = slugBase(name);
      let slug = base;
      let n = 2;
      while (
        (await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, slug)).limit(1)).length
      ) {
        slug = `${base}-${n++}`;
      }

      const [row] = await db
        .insert(companies)
        .values({
          slug,
          name,
          website: place.websiteUri ?? null,
          domain,
          googlePlaceId: place.id,
          googleRating: place.rating ?? null,
          googleRatingCount: place.userRatingCount ?? null,
          addressText: place.formattedAddress ?? null,
          lat: place.location?.latitude ?? null,
          lng: place.location?.longitude ?? null,
          primaryLocationId: hqLocation.id,
          source: "google_places",
        })
        .returning({ id: companies.id });
      companyId = row.id;
      stats.inserted++;
    }
    seen.add(place.id);

    // HQ link (from address) — upsert wins over any prior serves link.
    await db
      .insert(companyLocations)
      .values({ companyId, locationId: hqLocation.id, relation: "headquartered", weight: HQ_WEIGHT })
      .onConflictDoUpdate({
        target: [companyLocations.companyId, companyLocations.locationId],
        set: { relation: "headquartered", weight: HQ_WEIGHT },
      });
    stats.links++;

    // Serves link for the queried city, if different from HQ — never downgrades HQ.
    if (hqLocation.id !== queriedLoc.id) {
      await db
        .insert(companyLocations)
        .values({ companyId, locationId: queriedLoc.id, relation: "serves", weight: SERVES_WEIGHT })
        .onConflictDoNothing();
      stats.links++;
    }
  }

  for (const loc of leafLocations) {
    let locResults = 0;
    for (const template of QUERY_TEMPLATES) {
      const query = template.replace("{loc}", loc.name);
      let pageToken: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        let resp;
        try {
          resp = await searchText(query, { pageSize: 20, pageToken });
        } catch (err) {
          console.error(`  ✗ ${loc.name} [${template.split(" ")[0]}]: ${(err as Error).message}`);
          break;
        }
        for (const place of resp.places ?? []) await processPlace(place, loc);
        locResults += resp.places?.length ?? 0;
        pageToken = resp.nextPageToken;
        if (!pageToken) break;
        await sleep(150);
      }
      await sleep(120);
    }
    console.log(`  ${loc.name}: ${locResults} raw results`);
  }

  console.log(
    `\n✓ Ingest done.` +
      `\n  Unique places seen: ${seen.size}` +
      `\n  Inserted: ${stats.inserted} | Updated: ${stats.updated} | Unpublished (existing, now filtered): ${stats.unpublished}` +
      `\n  Skipped new — irrelevant: ${stats.skippedIrrelevant}, bare: ${stats.skippedBare}` +
      `\n  Location links written: ${stats.links}`,
  );
}

ingest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
