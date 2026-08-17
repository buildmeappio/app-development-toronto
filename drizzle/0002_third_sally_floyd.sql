CREATE TABLE "case_studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "focus_areas" text[];--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "facebook_url" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_studies_company_idx" ON "case_studies" USING btree ("company_id");