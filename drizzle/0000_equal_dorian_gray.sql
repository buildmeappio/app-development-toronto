CREATE TYPE "public"."claim_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('unclaimed', 'pending', 'claimed');--> statement-breakpoint
CREATE TYPE "public"."company_source" AS ENUM('google_places', 'manual', 'self_registered');--> statement-breakpoint
CREATE TYPE "public"."location_relation" AS ENUM('headquartered', 'serves');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('metro', 'region', 'city', 'district', 'neighbourhood');--> statement-breakpoint
CREATE TYPE "public"."placement_status" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."placement_type" AS ENUM('featured', 'badge');--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "claim_request_status" DEFAULT 'pending' NOT NULL,
	"domain_matched" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"domain" text,
	"description" text,
	"logo_url" text,
	"founded_year" integer,
	"team_size" text,
	"min_project_size" text,
	"hourly_rate" text,
	"google_place_id" text,
	"google_rating" double precision,
	"google_rating_count" integer,
	"address_text" text,
	"lat" double precision,
	"lng" double precision,
	"primary_location_id" uuid,
	"claim_status" "claim_status" DEFAULT 'unclaimed' NOT NULL,
	"source" "company_source" DEFAULT 'google_places' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_locations" (
	"company_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"relation" "location_relation" NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	CONSTRAINT "company_locations_company_id_location_id_pk" PRIMARY KEY("company_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "location_type" NOT NULL,
	"parent_id" uuid,
	"full_slug" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"location_id" uuid,
	"type" "placement_type" NOT NULL,
	"status" "placement_status" DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"stripe_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranking_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"period" text NOT NULL,
	"rank" integer NOT NULL,
	"score" double precision NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_primary_location_id_locations_id_fk" FOREIGN KEY ("primary_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_locations" ADD CONSTRAINT "company_locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_locations" ADD CONSTRAINT "company_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claims_company_idx" ON "claims" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "claims_user_idx" ON "claims" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_slug_unique" ON "companies" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_place_id_unique" ON "companies" USING btree ("google_place_id");--> statement-breakpoint
CREATE INDEX "companies_domain_idx" ON "companies" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "companies_primary_location_idx" ON "companies" USING btree ("primary_location_id");--> statement-breakpoint
CREATE INDEX "company_locations_location_idx" ON "company_locations" USING btree ("location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_slug_unique" ON "locations" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_full_slug_unique" ON "locations" USING btree ("full_slug");--> statement-breakpoint
CREATE INDEX "locations_parent_idx" ON "locations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "placements_company_idx" ON "placements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "placements_location_type_idx" ON "placements" USING btree ("location_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_unique" ON "ranking_snapshots" USING btree ("location_id","period","company_id");--> statement-breakpoint
CREATE INDEX "ranking_lookup_idx" ON "ranking_snapshots" USING btree ("location_id","period","rank");