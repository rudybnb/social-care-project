CREATE TABLE "remittance_workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"bank_name" text,
	"account_number" text,
	"sort_code" text,
	"email" text,
	"hourly_rate" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "remittance_workers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "days_per_week" integer DEFAULT 5;