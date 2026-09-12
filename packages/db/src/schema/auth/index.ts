import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { type OutboxEvent, outboxEvents } from "../outbox";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ponytail: authOutboxEvents aliases to unified outbox_events table
export const authOutboxEvents = outboxEvents;
export type AuthOutboxEvent = OutboxEvent;

export const authProcessedEvents = pgTable("auth_processed_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id").notNull().unique(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthProcessedEvent = typeof authProcessedEvents.$inferSelect;
