import { FOCUS_AREAS } from "@/db/schema";
import { slugify } from "./slug";

// Map between focus-area URL slugs and their display labels.
export const FOCUS_BY_SLUG = new Map(
  FOCUS_AREAS.map((label) => [slugify(label), label]),
);

export function focusLabelFromSlug(slug: string): string | null {
  return FOCUS_BY_SLUG.get(slug) ?? null;
}

export function focusToSlug(label: string): string {
  return slugify(label);
}
