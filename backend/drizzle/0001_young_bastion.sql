ALTER TABLE "shifts" ADD COLUMN "is_bank" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "clocked_in" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "clock_in_time" timestamp;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "clocked_out" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "clock_out_time" timestamp;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "qr_code" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "password" text;