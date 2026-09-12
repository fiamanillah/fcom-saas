import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// ponytail: ephemeral outbox table — rows exist only between DB transaction commit and BullMQ handoff
export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type OutboxEvent = typeof outboxEvents.$inferSelect;
export type NewOutboxEvent = typeof outboxEvents.$inferInsert;
