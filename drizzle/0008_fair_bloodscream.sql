CREATE TABLE "company_daily_clicks" (
	"company_id" uuid NOT NULL,
	"day" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "company_daily_clicks_company_id_day_pk" PRIMARY KEY("company_id","day")
);
--> statement-breakpoint
ALTER TABLE "company_daily_clicks" ADD CONSTRAINT "company_daily_clicks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;