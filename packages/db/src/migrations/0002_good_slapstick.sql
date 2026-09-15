ALTER TABLE "auth_processed_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "auth_processed_events" CASCADE;--> statement-breakpoint
ALTER TABLE "outbox_events" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "outbox_events" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "outbox_events" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "outbox_events" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "outbox_events" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "outbox_events" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "outbox_events" DROP COLUMN "sent_at";--> statement-breakpoint
ALTER TABLE "outbox_events" DROP COLUMN "archived_at";