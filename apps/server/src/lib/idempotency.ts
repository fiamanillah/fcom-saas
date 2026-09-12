import { createChildLogger } from "@syncdocket/infra/logger";
import { redis } from "./queue";

const logger = createChildLogger({ service: "idempotency" });

/**
 * Acquires a processing lease on an event ID.
 * ponytail: sets a short processing lease (60s). If the worker crashes mid-side-effect,
 * the lease auto-expires, allowing BullMQ retries to proceed safely instead of being silently dropped.
 *
 * @param eventId Unique event identifier
 * @param leaseTtlSeconds Short lease window while worker is active (Default: 60s)
 * @returns `true` if lease was acquired, `false` if already seen/processing
 */
async function acquire(eventId: string, leaseTtlSeconds = 60): Promise<boolean> {
  const key = `evt:seen:${eventId}`;
  try {
    const result = await redis.set(key, "processing", "EX", leaseTtlSeconds, "NX");
    return result === "OK";
  } catch (err) {
    logger.error({ eventId, err }, "Redis idempotency acquire check failed");
    // ponytail: fail-safe: if Redis is unavailable, allow execution rather than blocking the pipeline
    return true;
  }
}

/**
 * Marks the event as completed with a 24-hour retention TTL.
 * Subsequent deliveries within the retention window will be dropped.
 *
 * @param eventId Unique event identifier
 * @param retentionSeconds Deduplication retention window (Default: 86400s / 24h)
 */
async function complete(eventId: string, retentionSeconds = 86400): Promise<void> {
  const key = `evt:seen:${eventId}`;
  try {
    await redis.set(key, "completed", "EX", retentionSeconds);
  } catch (err) {
    logger.error({ eventId, err }, "Failed to mark event as completed in Redis");
  }
}

/**
 * Releases the event lock in case of transient failure where an immediate retry should proceed.
 */
async function release(eventId: string): Promise<void> {
  const key = `evt:seen:${eventId}`;
  try {
    await redis.del(key);
  } catch (err) {
    logger.error({ eventId, err }, "Failed to release event lock in Redis");
  }
}

export const IdempotencyManager = {
  acquire,
  complete,
  release,
};
