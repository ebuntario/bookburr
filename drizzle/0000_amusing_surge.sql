CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "activity_feed" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"member_id" text,
	"type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bukber_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"host_id" text NOT NULL,
	"name" text NOT NULL,
	"mode" text NOT NULL,
	"office_location" jsonb,
	"invite_code" text NOT NULL,
	"status" text DEFAULT 'collecting' NOT NULL,
	"expected_group_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bukber_sessions_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "date_options" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"date" date NOT NULL,
	"created_by" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "date_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"date_option_id" text NOT NULL,
	"member_id" text NOT NULL,
	"preference_level" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_members" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reference_location" jsonb,
	"proximity_tolerance" real,
	"budget_ceiling" integer,
	"session_cuisine_preferences" jsonb,
	"session_dietary_preferences" jsonb,
	"flexibility_score" real,
	"joined_via" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	"phone_number" text,
	"whatsapp_registered" boolean DEFAULT false NOT NULL,
	"marital_status" text,
	"dietary_preferences" jsonb,
	"default_cuisine_preferences" jsonb,
	"favorite_venues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venue_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"venue_id" text NOT NULL,
	"member_id" text NOT NULL,
	"emoji" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"venue_id" text NOT NULL,
	"member_id" text NOT NULL,
	"is_terserah" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"google_place_id" text,
	"name" text NOT NULL,
	"location" jsonb,
	"rating" real,
	"price_level" integer,
	"cuisine_type" text,
	"capacity" integer,
	"composite_score" real DEFAULT 0 NOT NULL,
	"social_link_url" text,
	"social_link_platform" text,
	"social_link_metadata" jsonb,
	"suggested_by_member_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_feed" ADD CONSTRAINT "activity_feed_session_id_bukber_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bukber_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_feed" ADD CONSTRAINT "activity_feed_member_id_session_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."session_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bukber_sessions" ADD CONSTRAINT "bukber_sessions_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_options" ADD CONSTRAINT "date_options_session_id_bukber_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bukber_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_options" ADD CONSTRAINT "date_options_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_votes" ADD CONSTRAINT "date_votes_date_option_id_date_options_id_fk" FOREIGN KEY ("date_option_id") REFERENCES "public"."date_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "date_votes" ADD CONSTRAINT "date_votes_member_id_session_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."session_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_members" ADD CONSTRAINT "session_members_session_id_bukber_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bukber_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_members" ADD CONSTRAINT "session_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_reactions" ADD CONSTRAINT "venue_reactions_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_reactions" ADD CONSTRAINT "venue_reactions_member_id_session_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."session_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_votes" ADD CONSTRAINT "venue_votes_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_votes" ADD CONSTRAINT "venue_votes_member_id_session_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."session_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_session_id_bukber_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."bukber_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_suggested_by_member_id_session_members_id_fk" FOREIGN KEY ("suggested_by_member_id") REFERENCES "public"."session_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_feed_session_created" ON "activity_feed" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_bukber_sessions_invite_code" ON "bukber_sessions" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "idx_bukber_sessions_host_id" ON "bukber_sessions" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_date_options_session_id" ON "date_options" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_date_votes_option_member" ON "date_votes" USING btree ("date_option_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_date_votes_date_option_id" ON "date_votes" USING btree ("date_option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_session_members_session_user" ON "session_members" USING btree ("session_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_session_members_session_id" ON "session_members" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_venue_reactions_venue_member_emoji" ON "venue_reactions" USING btree ("venue_id","member_id","emoji");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_venue_votes_venue_member" ON "venue_votes" USING btree ("venue_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_venue_votes_venue_id" ON "venue_votes" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "idx_venues_session_id" ON "venues" USING btree ("session_id");