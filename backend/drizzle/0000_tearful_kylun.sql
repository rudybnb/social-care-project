CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"shift_id" uuid,
	"clock_in" timestamp,
	"clock_out" timestamp,
	"gps_lat" text,
	"gps_lng" text,
	"photo_url" text,
	"break_minutes" integer DEFAULT 0,
	"overtime_minutes" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text,
	"status" text DEFAULT 'open',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"shift_id" uuid,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"task_completed" boolean DEFAULT false,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"name" text NOT NULL,
	"qr_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"staff_name" text NOT NULL,
	"site_id" text NOT NULL,
	"site_name" text NOT NULL,
	"site_color" text NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration" integer NOT NULL,
	"is_24_hour" boolean DEFAULT false,
	"approved_24hr_by" text,
	"notes" text,
	"extended" boolean DEFAULT false,
	"extension_hours" integer,
	"extension_reason" text,
	"extension_approved_by" text,
	"extension_approval_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"postcode" text NOT NULL,
	"address" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"qr_generated" boolean DEFAULT false,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"site" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"standard_rate" numeric(10, 2) DEFAULT '12.50' NOT NULL,
	"enhanced_rate" text DEFAULT '—',
	"night_rate" text DEFAULT '—',
	"rates" text NOT NULL,
	"pension" text DEFAULT '—',
	"deductions" text DEFAULT '£0.00',
	"tax" text DEFAULT '—',
	"weekly_hours" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
