CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_initials" text NOT NULL,
	"quote_status" text DEFAULT 'Draft Quote',
	"provider_name" text,
	"placement_type" text,
	"created_date" text,
	"state_data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_child_initials_unique" UNIQUE("child_initials")
);
--> statement-breakpoint
ALTER TABLE "leave_balances" ALTER COLUMN "total_entitlement" SET DEFAULT 224;--> statement-breakpoint
ALTER TABLE "leave_balances" ALTER COLUMN "hours_remaining" SET DEFAULT 224;