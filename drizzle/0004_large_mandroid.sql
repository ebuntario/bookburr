DROP INDEX "uq_venue_votes_venue_member";--> statement-breakpoint
ALTER TABLE "venue_votes" ALTER COLUMN "venue_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "venue_votes" ADD COLUMN "session_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "venue_votes" ADD CONSTRAINT "venue_votes_session_id_bukber_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bukber_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_venue_votes_session_member" ON "venue_votes" USING btree ("session_id","member_id");