CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" text NOT NULL,
	"staff_name" text NOT NULL,
	"site_id" text NOT NULL,
	"site_name" text NOT NULL,
	"date" text NOT NULL,
	"request_time" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" text NOT NULL,
	"staff_name" text NOT NULL,
	"year" integer NOT NULL,
	"total_entitlement" integer DEFAULT 112 NOT NULL,
	"hours_accrued" integer DEFAULT 0 NOT NULL,
	"hours_used" integer DEFAULT 0 NOT NULL,
	"hours_remaining" integer DEFAULT 112 NOT NULL,
	"carry_over_from_previous" integer DEFAULT 0,
	"carry_over_to_next" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"staff_id" text NOT NULL,
	"staff_name" text NOT NULL,
	"date" text NOT NULL,
	"hours" integer DEFAULT 8 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" text NOT NULL,
	"staff_name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"total_days" integer NOT NULL,
	"total_hours" integer NOT NULL,
	"reason" text,
	"leave_type" text DEFAULT 'annual' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"admin_notes" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shifts" ALTER COLUMN "duration" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "staff_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "decline_reason" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "auto_accepted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "response_locked" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "week_deadline" timestamp;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "published" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "telegram_chat_id" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "start_date" text;