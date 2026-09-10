import { db } from "@syncdocket/db";
import { eq } from "drizzle-orm";
import { createChildLogger } from "@/lib/logger";
import { authProcessedEvents } from "../schema";

const logger = createChildLogger({ module: "auth", event: "user.registered" });

export interface UserRegisteredEvent {
  id: string;
  eventType: "auth.user.registered";
  payload: {
    userId: string;
    email: string;
    name?: string | null;
  };
}

export async function onUserRegistered(event: UserRegisteredEvent): Promise<void> {
  const [existing] = await db
    .select({ id: authProcessedEvents.id })
    .from(authProcessedEvents)
    .where(eq(authProcessedEvents.eventId, event.id))
    .limit(1);

  if (existing) {
    logger.info({ eventId: event.id }, "Duplicate event skipped (already processed)");
    return;
  }

  await db.transaction(async (tx) => {
    await tx.insert(authProcessedEvents).values({
      eventId: event.id,
    });

    // ponytail: queue welcome email only when email worker is activated; structured log is sufficient for now
    logger.info(
      { userId: event.payload.userId, email: event.payload.email },
      "User registered event successfully processed",
    );
  });
}
