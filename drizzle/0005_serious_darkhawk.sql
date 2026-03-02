ALTER TABLE "bukber_sessions" ADD COLUMN "session_shape" text DEFAULT 'need_both' NOT NULL;--> statement-breakpoint
ALTER TABLE "bukber_sessions" ADD COLUMN "date_range_start" date;--> statement-breakpoint
ALTER TABLE "bukber_sessions" ADD COLUMN "date_range_end" date;--> statement-breakpoint
ALTER TABLE "bukber_sessions" ADD COLUMN "dates_locked" boolean DEFAULT false NOT NULL;