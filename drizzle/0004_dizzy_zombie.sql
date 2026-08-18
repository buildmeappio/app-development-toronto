CREATE TYPE "public"."review_status" AS ENUM('pending', 'published', 'rejected');--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"reviewer_name" text NOT NULL,
	"reviewer_role" text,
	"reviewer_company" text,
	"rating" integer NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"project_type" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_company_status_idx" ON "reviews" USING btree ("company_id","status");