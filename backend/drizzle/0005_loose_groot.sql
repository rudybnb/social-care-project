CREATE TABLE "remittances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_no" text NOT NULL,
	"payment_date" text NOT NULL,
	"vendor_id" text,
	"site_name" text,
	"payee_name" text NOT NULL,
	"payee_address" text,
	"bank_name" text,
	"account_number" text,
	"sort_code" text,
	"description" text NOT NULL,
	"dates_covered" text NOT NULL,
	"hours_worked" text NOT NULL,
	"hourly_rate" text NOT NULL,
	"payment_total" text NOT NULL,
	"email_to" text,
	"status" text DEFAULT 'sent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "is_offered_for_swap" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "is_swapped" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "original_staff_id" text;