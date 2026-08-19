CREATE TYPE "public"."invitation_status" AS ENUM('invited', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "review_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"client_name" text,
	"client_email" text NOT NULL,
	"token" text NOT NULL,
	"status" "invitation_status" DEFAULT 'invited' NOT NULL,
	"review_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_invitations" ADD CONSTRAINT "review_invitations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_invitations" ADD CONSTRAINT "review_invitations_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "review_invitations_token_unique" ON "review_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "review_invitations_company_idx" ON "review_invitations" USING btree ("company_id");