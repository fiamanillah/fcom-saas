CREATE TABLE "auth_processed_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_processed_events_event_id_unique" UNIQUE("event_id")
);
