// Env loaded via `tsx --env-file=.env.local` (see package.json curate:ingest).
import { db } from "./index";
import { locations, companies, companyLocations } from "./schema";
import { eq, inArray } from "drizzle-orm";
import { searchText, type PlaceResult } from "../lib/places";
import { slugify, extractDomain } from "../lib/slug";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Build a reasonable slug base from a possibly-long Google business name. */
function slugBase(name: string): string {
  // Drop marketing tails after a separator ("DevDec - Your local app devs").
  const head = name.split(/\s[-|—:]\s/)[0].trim() || name;
  return slugify(head).slice(0, 60) || "company";
}

/** Pull the city token out of "…, Mississauga, ON L5N 1J8, Canada". */
function cityFromAddress(address?: string): string | null {
  if (!address) return null;
  const m = address.match(/,\s*([^,]+),\s*ON\b/i);
  return m ? m[1].trim().toLowerCase() : null;
}

async function ingest() {
  // Tight crawl: one query per leaf location (cities + Toronto districts).
  const leafLocations = await db
    .select()
    .from(locations)
    .where(inArray(locations.type, ["city", "district"]));

  // Resolver: map every known location name -> location, plus a "toronto" alias.
  const allLocations = await db.select().from(locations);
  const byName = new Map<string, (typeof allLocations)[number]>();
  for (const l of allLocations) byName.set(l.name.toLowerCase(), l);
  const oldToronto = allLocations.find((l) => l.slug === "old-toronto");
  if (oldToronto) byName.set("toronto", oldToronto);

  const resolveLocation = (address: string | undefined, fallback: (typeof allLocations)[number]) => {
    const city = cityFromAddress(address);
    return (city && byName.get(city)) || fallback;
  };

  let seenPlaceIds = new Set<string>();
  let inserted = 0;
  let updated = 0;
  let linked = 0;

  for (const loc of leafLocations) {
    const query = `app development company in ${loc.name}, Ontario, Canada`;
    let results: PlaceResult[] = [];
    try {
      const resp = await searchText(query, { pageSize: 20 });
      results = resp.places ?? [];
    } catch (err) {
      console.error(`  ✗ ${loc.name}: ${(err as Error).message}`);
      continue;
    }

    let locNew = 0;
    for (const place of results) {
      if (!place.displayName?.text) continue;
      if (place.businessStatus === "CLOSED_PERMANENTLY") continue;

      const name = place.displayName.text;
      const hqLocation = resolveLocation(place.formattedAddress, loc);
      const domain = extractDomain(place.websiteUri);

      // Does this company already exist (by Google place id)?
      const [existing] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.googlePlaceId, place.id))
        .limit(1);

      let companyId: string;
      if (existing) {
        await db
          .update(companies)
          .set({
            name,
            website: place.websiteUri ?? null,
            domain,
            googleRating: place.rating ?? null,
            googleRatingCount: place.userRatingCount ?? null,
            addressText: place.formattedAddress ?? null,
            lat: place.location?.latitude ?? null,
            lng: place.location?.longitude ?? null,
            updatedAt: new Date(),
          })
          .where(eq(companies.id, existing.id));
        companyId = existing.id;
        updated++;
      } else {
        // Ensure a unique slug (name+city, with a place-id suffix on collision).
        let slug = `${slugBase(name)}-${hqLocation.slug}`;
        const [clash] = await db
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.slug, slug))
          .limit(1);
        if (clash) slug = `${slug}-${place.id.slice(-6).toLowerCase()}`;

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
        inserted++;
        if (!seenPlaceIds.has(place.id)) locNew++;
      }
      seenPlaceIds.add(place.id);

      // Link company -> its HQ location (idempotent).
      await db
        .insert(companyLocations)
        .values({
          companyId,
          locationId: hqLocation.id,
          relation: "headquartered",
          weight: 1,
        })
        .onConflictDoNothing();
      linked++;
    }

    console.log(`  ${loc.name}: ${results.length} results (${locNew} new)`);
    await sleep(200); // be polite to the API
  }

  console.log(
    `\n✓ Ingest done. Inserted ${inserted}, updated ${updated}, ${seenPlaceIds.size} unique companies, ${linked} location links.`,
  );
}

ingest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
