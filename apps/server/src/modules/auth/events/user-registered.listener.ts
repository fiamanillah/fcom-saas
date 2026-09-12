import { createChildLogger } from "@syncdocket/infra/logger";
import { IdempotencyManager } from "@/lib/idempotency";

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
  // Step 1: Redis check-and-acquire lease ($O(1)$ fast path)
  const isAcquired = await IdempotencyManager.acquire(event.id);
  if (!isAcquired) {
    logger.info(
      { eventId: event.id },
      "Duplicate event skipped (already processed or active lease)",
    );
    return;
  }

  try {
    // Step 2: Execute side-effects
    // ponytail: queue welcome email only when email worker is activated; structured log is sufficient for now
    logger.info(
      { userId: event.payload.userId, email: event.payload.email },
      "User registered event successfully processed",
    );

    // Step 3: Mark completed with 24-hour retention window
    await IdempotencyManager.complete(event.id);
  } catch (error) {
    // Release lease so queue retry can re-attempt immediately
    await IdempotencyManager.release(event.id);
    throw error;
  }
}
