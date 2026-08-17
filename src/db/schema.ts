import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  doublePrecision,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ---------------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------------- */

// The GTA hierarchy: metro > region > city/town > district > neighbourhood.
export const locationTypeEnum = pgEnum("location_type", [
  "metro",
  "region",
  "city",
  "district",
  "neighbourhood",
]);

export const claimStatusEnum = pgEnum("claim_status", [
  "unclaimed",
  "pending",
  "claimed",
]);

// Where a company's data originated. Google Places is the primary source.
export const companySourceEnum = pgEnum("company_source", [
  "google_places",
  "manual",
  "self_registered",
]);

// "headquartered" = physically located here. "serves" = offers services here
// but is based elsewhere. Serves-relationships are weighted lower in rankings.
export const locationRelationEnum = pgEnum("location_relation", [
  "headquartered",
  "serves",
]);

// Paid placements. Neither one mutates the computed ranking score — they render
// as labeled sponsored slots / inline badges so the rankings stay trustworthy.
export const placementTypeEnum = pgEnum("placement_type", [
  "featured",
  "badge",
]);

export const placementStatusEnum = pgEnum("placement_status", [
  "active",
  "expired",
  "cancelled",
]);

export const claimRequestStatusEnum = pgEnum("claim_request_status", [
  "pending",
  "approved",
  "rejected",
]);

/* ---------------------------------------------------------------------------
 * Locations — self-referential tree seeded with the fixed GTA geography.
 * ------------------------------------------------------------------------- */

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: locationTypeEnum("type").notNull(),
    parentId: uuid("parent_id"),
    // Denormalized for fast breadcrumb / URL building without recursive queries.
    fullSlug: text("full_slug").notNull(), // e.g. "peel/mississauga"
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("locations_slug_unique").on(t.slug),
    uniqueIndex("locations_full_slug_unique").on(t.fullSlug),
    index("locations_parent_idx").on(t.parentId),
  ],
);

export const locationsRelations = relations(locations, ({ one, many }) => ({
  parent: one(locations, {
    fields: [locations.parentId],
    references: [locations.id],
    relationName: "location_parent",
  }),
  children: many(locations, { relationName: "location_parent" }),
  companyLocations: many(companyLocations),
}));

/* ---------------------------------------------------------------------------
 * Companies — curated app-development firms.
 * ------------------------------------------------------------------------- */

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    website: text("website"),
    domain: text("domain"), // normalized apex domain, used for claim verification
    description: text("description"),
    logoUrl: text("logo_url"),

    // Profile signals (many empty until claimed → incentive to claim & complete).
    foundedYear: integer("founded_year"),
    teamSize: text("team_size"), // e.g. "10-49"
    minProjectSize: text("min_project_size"), // e.g. "$10,000+"
    hourlyRate: text("hourly_rate"), // e.g. "$50-$99/hr"

    // Rep-editable profile enrichment (all free to fill in).
    focusAreas: text("focus_areas").array(), // e.g. ["iOS apps","Web apps"]
    linkedinUrl: text("linkedin_url"),
    twitterUrl: text("twitter_url"),
    facebookUrl: text("facebook_url"),
    instagramUrl: text("instagram_url"),

    // Google Places signals — our day-one review-quality proxy.
    googlePlaceId: text("google_place_id"),
    googleRating: doublePrecision("google_rating"),
    googleRatingCount: integer("google_rating_count"),

    addressText: text("address_text"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),

    // The location this company is headquartered in (also mirrored in
    // companyLocations with relation="headquartered").
    primaryLocationId: uuid("primary_location_id").references(
      () => locations.id,
    ),

    claimStatus: claimStatusEnum("claim_status").notNull().default("unclaimed"),
    source: companySourceEnum("source").notNull().default("google_places"),
    isPublished: boolean("is_published").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("companies_slug_unique").on(t.slug),
    uniqueIndex("companies_place_id_unique").on(t.googlePlaceId),
    index("companies_domain_idx").on(t.domain),
    index("companies_primary_location_idx").on(t.primaryLocationId),
  ],
);

export const companiesRelations = relations(companies, ({ one, many }) => ({
  primaryLocation: one(locations, {
    fields: [companies.primaryLocationId],
    references: [locations.id],
  }),
  companyLocations: many(companyLocations),
  rankingSnapshots: many(rankingSnapshots),
  placements: many(placements),
}));

/* ---------------------------------------------------------------------------
 * CompanyLocations — the many-to-many that drives the SEO page matrix.
 * A company appears on every location page it is linked to.
 * ------------------------------------------------------------------------- */

export const companyLocations = pgTable(
  "company_locations",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    relation: locationRelationEnum("relation").notNull(),
    // Ranking weight multiplier: 1.0 for HQ, <1 for serves-only.
    weight: doublePrecision("weight").notNull().default(1),
  },
  (t) => [
    primaryKey({ columns: [t.companyId, t.locationId] }),
    index("company_locations_location_idx").on(t.locationId),
  ],
);

export const companyLocationsRelations = relations(
  companyLocations,
  ({ one }) => ({
    company: one(companies, {
      fields: [companyLocations.companyId],
      references: [companies.id],
    }),
    location: one(locations, {
      fields: [companyLocations.locationId],
      references: [locations.id],
    }),
  }),
);

/* ---------------------------------------------------------------------------
 * RankingSnapshots — materialized monthly per (location, period).
 * period is "all-time" (canonical page) or "YYYY-MM" (dated archive page).
 * ------------------------------------------------------------------------- */

export const rankingSnapshots = pgTable(
  "ranking_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // "all-time" | "2026-08"
    rank: integer("rank").notNull(),
    score: doublePrecision("score").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("ranking_unique").on(t.locationId, t.period, t.companyId),
    index("ranking_lookup_idx").on(t.locationId, t.period, t.rank),
  ],
);

export const rankingSnapshotsRelations = relations(
  rankingSnapshots,
  ({ one }) => ({
    company: one(companies, {
      fields: [rankingSnapshots.companyId],
      references: [companies.id],
    }),
    location: one(locations, {
      fields: [rankingSnapshots.locationId],
      references: [locations.id],
    }),
  }),
);

/* ---------------------------------------------------------------------------
 * Profiles — mirrors Supabase auth.users for app-level data.
 * ------------------------------------------------------------------------- */

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // == auth.users.id
  email: text("email").notNull(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------------------------------------------------------------------------
 * Claims — a user's request to own a company profile (free).
 * Domain match (user email domain == company domain) is the first signal.
 * ------------------------------------------------------------------------- */

export const claims = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: claimRequestStatusEnum("status").notNull().default("pending"),
    domainMatched: boolean("domain_matched").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("claims_company_idx").on(t.companyId),
    index("claims_user_idx").on(t.userId),
  ],
);

/* ---------------------------------------------------------------------------
 * Placements — paid featured slots and verified badges.
 * ------------------------------------------------------------------------- */

export const placements = pgTable(
  "placements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    // null locationId on a "featured" placement = featured everywhere.
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "cascade",
    }),
    type: placementTypeEnum("type").notNull(),
    status: placementStatusEnum("status").notNull().default("active"),
    startsAt: timestamp("starts_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("placements_company_idx").on(t.companyId),
    index("placements_location_type_idx").on(t.locationId, t.type),
  ],
);

export const placementsRelations = relations(placements, ({ one }) => ({
  company: one(companies, {
    fields: [placements.companyId],
    references: [companies.id],
  }),
  location: one(locations, {
    fields: [placements.locationId],
    references: [locations.id],
  }),
}));

/* ---------------------------------------------------------------------------
 * Inquiries — "request a call" leads for paid features. Payment happens offline
 * (e-Transfer); the team activates the corresponding placement manually.
 * ------------------------------------------------------------------------- */

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "contacted",
  "won",
  "closed",
]);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable: a lead may come in before we know which company (or a browse-y lead).
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    contactName: text("contact_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    // Comma-separated feature interest, e.g. "featured,badge".
    interestedIn: text("interested_in"),
    message: text("message"),
    status: inquiryStatusEnum("status").notNull().default("new"),
    // Hashed client IP (not raw) — used only for abuse rate-limiting.
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("inquiries_status_idx").on(t.status),
    index("inquiries_company_idx").on(t.companyId),
  ],
);

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  company: one(companies, {
    fields: [inquiries.companyId],
    references: [companies.id],
  }),
}));

/* ---------------------------------------------------------------------------
 * Case studies — portfolio entries a claimed company can add. Free profiles are
 * capped at 3; the paid "Verified" tier unlocks unlimited (Clutch's model).
 * ------------------------------------------------------------------------- */

export const caseStudies = pgTable(
  "case_studies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("case_studies_company_idx").on(t.companyId)],
);

export const caseStudiesRelations = relations(caseStudies, ({ one }) => ({
  company: one(companies, {
    fields: [caseStudies.companyId],
    references: [companies.id],
  }),
}));

// The free case-study cap; Verified unlocks unlimited.
export const FREE_CASE_STUDY_LIMIT = 3;

// Fixed taxonomy of service focus areas reps can tag (also powers filtering).
export const FOCUS_AREAS = [
  "iOS apps",
  "Android apps",
  "Cross-platform (Flutter / React Native)",
  "Web apps",
  "Backend & APIs",
  "UI/UX design",
  "MVP & prototyping",
  "AI & ML integration",
  "E-commerce",
  "App maintenance & support",
] as const;
