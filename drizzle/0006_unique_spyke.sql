CREATE TYPE "public"."import_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TYPE "public"."review_source" AS ENUM('google', 'clutch', 'goodfirms', 'designrush');--> statement-breakpoint
CREATE TABLE "review_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"source" "review_source" NOT NULL,
	"source_url" text NOT NULL,
	"status" "import_status" DEFAULT 'active' NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_count" integer,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "source" text DEFAULT 'firstparty' NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "review_imports" ADD CONSTRAINT "review_imports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "review_imports_company_unique" ON "review_imports" USING btree ("company_id");