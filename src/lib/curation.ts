/**
 * Curation heuristics for Google Places results — kept separate from the
 * ingestion script so they're easy to eyeball and unit-test.
 */
import { slugify } from "./slug";
import type { PlaceResult } from "./places";

// Clear signals a business IS app/software development. Deliberately excludes
// over-broad terms ("digital", "system", bare "development") that pulled in
// marketing/security/property-development firms.
const ALLOW = [
  "app",
  "apps",
  "mobile app",
  "software",
  "web develop",
  "web design",
  "website",
  "app develop",
  "developer",
  "software development",
  "tech",
  "technolog",
  "code",
  "coding",
  "labs",
  "cloud",
  "saas",
  "programming",
  "programmer",
  "it services",
  "it solutions",
  "it consult",
];

// Clear signals a business is NOT app/software development. Checked first, so a
// denied term always wins over an allowed one.
const DENY = [
  // devices / trades / services
  "repair",
  "phone",
  "cell",
  "screen",
  "cctv",
  "camera",
  "printer",
  "cartridge",
  "toner",
  "staffing",
  "recruit",
  "notary",
  "immigration",
  "cleaning",
  "plumbing",
  "hvac",
  "dental",
  "insurance",
  "law firm",
  "lawyer",
  "restaurant",
  "salon",
  "spa",
  // adjacent-but-not-app-dev categories that kept slipping through
  "smart home",
  "security system",
  "security systems",
  "surveillance",
  "alarm",
  "solar",
  "digital marketing",
  "marketing",
  "seo",
  "real estate",
  "realty",
  "developments", // plural → property developer
  "property",
  "properties",
  "general contractor",
  "contracting",
  "renovation",
  "landscap",
  "roofing",
  "flooring",
  "furniture",
  "clinic",
  "pharmacy",
  "travel",
  "logistics",
  "accounting",
  "bookkeeping",
  "photography",
  "video production",
];

/** Trim marketing tails: "DevDec - Your local app developers" -> "DevDec". */
export function cleanName(raw: string): string {
  const head = raw.split(/\s[-|–—:]\s/)[0].trim();
  return head.length >= 2 ? head : raw.trim();
}

/** A short slug base from a (possibly long) business name. */
export function slugBase(name: string): string {
  return slugify(cleanName(name)).slice(0, 60) || "company";
}

/** Pull the city token from "…, Mississauga, ON L5N 1J8, Canada". */
export function cityFromAddress(address?: string): string | null {
  if (!address) return null;
  const m = address.match(/,\s*([^,]+),\s*ON\b/i);
  return m ? m[1].trim().toLowerCase() : null;
}

export type QualityVerdict = {
  relevant: boolean;
  bare: boolean; // no website AND no rating AND no phone → low value
  reason: string;
};

/** Keyword relevance decision over an arbitrary text blob (name + types). */
export function assessText(text: string): { relevant: boolean; reason: string } {
  const hay = text.toLowerCase();
  const denied = DENY.find((k) => hay.includes(k));
  if (denied) return { relevant: false, reason: `deny:${denied}` };
  const allowed = ALLOW.find((k) => hay.includes(k));
  if (!allowed) return { relevant: false, reason: "no-keyword" };
  return { relevant: true, reason: `allow:${allowed}` };
}

/** Decide whether a place belongs in the directory. */
export function assessPlace(place: PlaceResult): QualityVerdict {
  const { relevant, reason } = assessText(
    `${place.displayName?.text ?? ""} ${(place.types ?? []).join(" ")} ${place.primaryType ?? ""}`,
  );
  const bare =
    !place.websiteUri && place.rating == null && !place.nationalPhoneNumber;
  return { relevant, bare, reason };
}
