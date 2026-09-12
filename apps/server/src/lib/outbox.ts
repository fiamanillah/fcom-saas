import { db, outboxEvents } from "@syncdocket/db";
import { createChildLogger } from "@syncdocket/infra/logger";
import { asc, eq, inArray } from "drizzle-orm";
import { Client } from "pg";
import { domainEventsQueue } from "./queue";

const logger = createChildLogger({ service: "outbox-worker" });

export interface OutboxWorkerOptions {
  batchSize?: number;
  fallbackPollIntervalMs?: number;
  maxDeliveryAttempts?: number;
}

export class OutboxWorker {
  private isRunning = false;
  private pgListenerClient: Client | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private batchSize: number;
  private fallbackPollIntervalMs: number;
  private maxDeliveryAttempts: number;

  constructor(options: OutboxWorkerOptions = {}) {
    this.batchSize = options.batchSize ?? 50;
    this.fallbackPollIntervalMs = options.fallbackPollIntervalMs ?? 5000;
    this.maxDeliveryAttempts = options.maxDeliveryAttempts ?? 5;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info("Starting ephemeral outbox worker with LISTEN/NOTIFY and fallback loop");
    await this.setupNotificationListener();
    this.scheduleFallbackPoll();
  }

  private async setupNotificationListener() {
    if (!process.env.DATABASE_URL) return;

    try {
      this.pgListenerClient = new Client({ connectionString: process.env.DATABASE_URL });
      await this.pgListenerClient.connect();
      await this.pgListenerClient.query("LISTEN outbox_channel");

      this.pgListenerClient.on("notification", async () => {
        try {
          await this.processBatch();
        } catch (err) {
          logger.error({ err }, "Error processing outbox batch from NOTIFY event");
        }
      });

      this.pgListenerClient.on("error", (err) => {
        logger.error({ err }, "Postgres LISTEN client error. Reconnecting in 5s...");
        if (this.isRunning) {
          setTimeout(() => this.setupNotificationListener(), 5000);
        }
      });
    } catch (error) {
      logger.error({ error }, "Failed to connect PG LISTEN client. Relying on fallback polling.");
    }
  }

  private scheduleFallbackPoll() {
    if (!this.isRunning) return;

    this.fallbackTimer = setTimeout(async () => {
      try {
        await this.processBatch();
      } catch (err) {
        logger.error({ err }, "Error in outbox fallback poll tick");
      }
      this.scheduleFallbackPoll();
    }, this.fallbackPollIntervalMs);
  }

  /**
   * Processes a batch of pending events using FOR UPDATE SKIP LOCKED
   * and dispatches in bulk to BullMQ, deleting succeeded rows immediately.
   */
  async processBatch(batchSize = this.batchSize): Promise<number> {
    return await db.transaction(async (tx) => {
      // ponytail: SKIP LOCKED atomically selects and locks pending rows without worker collision
      const pendingEvents = await tx
        .select()
        .from(outboxEvents)
        .orderBy(asc(outboxEvents.createdAt))
        .limit(batchSize)
        .for("update", { skipLocked: true });

      if (pendingEvents.length === 0) {
        return 0;
      }

      const jobs = pendingEvents.map((event) => ({
        name: event.eventType,
        data: {
          id: event.id,
          eventType: event.eventType,
          payload: event.payload,
        },
        opts: { jobId: event.id }, // Deduplicate in BullMQ
      }));

      try {
        // ponytail: addBulk delivers all events in a single network round-trip (<2ms lock time)
        await domainEventsQueue.addBulk(jobs);

        // ZERO BLOAT: Delete immediately on confirmed handoff
        const deliveredIds = pendingEvents.map((e) => e.id);
        await tx.delete(outboxEvents).where(inArray(outboxEvents.id, deliveredIds));

        logger.info(
          { count: deliveredIds.length },
          "Dispatched and deleted ephemeral outbox events",
        );
        return deliveredIds.length;
      } catch (deliveryError: unknown) {
        logger.error(
          { count: pendingEvents.length, err: deliveryError },
          "Failed to deliver outbox batch to BullMQ",
        );

        const errorMessage =
          deliveryError instanceof Error ? deliveryError.message : String(deliveryError);

        for (const event of pendingEvents) {
          const attempts = event.attempts + 1;
          if (attempts >= this.maxDeliveryAttempts) {
            logger.fatal(
              { eventId: event.id, attempts, err: deliveryError },
              "Outbox event exceeded max delivery attempts (quarantined in outbox)",
            );
          }

          await tx
            .update(outboxEvents)
            .set({
              attempts,
              lastError: errorMessage,
            })
            .where(eq(outboxEvents.id, event.id));
        }

        return 0;
      }
    });
  }

  async stop() {
    this.isRunning = false;
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    if (this.pgListenerClient) {
      await this.pgListenerClient.end().catch(() => {});
      this.pgListenerClient = null;
    }
    logger.info("Stopped ephemeral outbox worker");
  }
}

export const outboxWorker = new OutboxWorker();

export async function pollAndProcessOutbox(options: { batchSize?: number } = {}) {
  return await outboxWorker.processBatch(options.batchSize);
}

export function startOutboxWorker(options?: OutboxWorkerOptions) {
  if (options) {
    const customWorker = new OutboxWorker(options);
    customWorker.start();
    return customWorker;
  }
  outboxWorker.start();
  return outboxWorker;
}

export function stopOutboxWorker() {
  return outboxWorker.stop();
}
