ALTER TABLE "bukber_sessions" ADD COLUMN "confirmed_venue_id" text;--> statement-breakpoint
ALTER TABLE "bukber_sessions" ADD COLUMN "confirmed_date_option_id" text;--> statement-breakpoint
CREATE INDEX "idx_venue_reactions_venue_id" ON "venue_reactions" USING btree ("venue_id");