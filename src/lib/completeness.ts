import type { InferSelectModel } from "drizzle-orm";
import type { companies } from "@/db/schema";

type Company = InferSelectModel<typeof companies>;

/** Profile-completeness checklist. Drives the progress bar and nudges reps to
 * fill out their profile (which also lifts their ranking score). */
export function computeCompleteness(
  company: Company,
  opts: { caseStudies: number; socials: number },
) {
  const items = [
    { label: "Description", done: !!company.description },
    { label: "Focus areas", done: (company.focusAreas ?? []).length > 0 },
    { label: "Logo", done: !!company.logoUrl },
    { label: "Founded year", done: company.foundedYear != null },
    { label: "Team size", done: !!company.teamSize },
    {
      label: "Rates & project size",
      done: !!company.hourlyRate || !!company.minProjectSize,
    },
    { label: "A case study", done: opts.caseStudies > 0 },
    { label: "A social link", done: opts.socials > 0 },
  ];
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return { percent, done, total: items.length, items };
}
