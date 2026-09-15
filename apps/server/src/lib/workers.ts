import { type Job, Worker } from "bullmq";
import { onUserRegistered } from "../modules/auth";
import { outboxWorker, pollAndProcessOutbox, startOutboxWorker, stopOutboxWorker } from "./outbox";
import {
  connection,
  type DomainEventJobData,
  type EmailJobData,
  type NotificationJobData,
} from "./queue";

/**
 * Domain events worker - processes domain events dispatched from outbox
 */
export const domainEventsWorker = new Worker<DomainEventJobData>(
  "domain-events",
  async (job: Job<DomainEventJobData>) => {
    const { id, eventType, payload } = job.data;

    switch (eventType) {
      case "auth.user.registered":
        await onUserRegistered({
          id,
          eventType: "auth.user.registered",
          payload: payload as { userId: string; email: string; name?: string | null },
        });
        break;
      default:
        console.warn(`Unhandled domain event type: ${eventType} (job ID: ${job.id})`);
        break;
    }
  },
  {
    connection,
    concurrency: 10,
  },
);

/**
 * Email worker - processes email sending jobs
 * @see https://docs.bullmq.io/guide/workers
 */
export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    const { to } = job.data;

    console.log(`Processing email job ${job.id}: sending to ${to}`);

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`Email job ${job.id} completed: sent to ${to}`);

    return { sent: true, to, timestamp: new Date().toISOString() };
  },
  {
    connection,
    concurrency: 5, // Process up to 5 jobs in parallel
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // Per minute (rate limiting)
    },
  },
);

/**
 * Notification worker - processes notification jobs
 */
export const notificationWorker = new Worker<NotificationJobData>(
  "notification",
  async (job: Job<NotificationJobData>) => {
    const { userId, type } = job.data;

    console.log(`Processing notification job ${job.id}: ${type} to user ${userId}`);

    // Simulate notification processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log(`Notification job ${job.id} completed`);

    return { sent: true, type, userId, timestamp: new Date().toISOString() };
  },
  {
    connection,
    concurrency: 10,
  },
);

// Event handlers for monitoring
domainEventsWorker.on("completed", (job) => {
  console.log(`Domain event job ${job.id} (${job.name}) has completed`);
});

domainEventsWorker.on("failed", (job, err) => {
  console.error(`Domain event job ${job?.id} (${job?.name}) failed: ${err.message}`);
});

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} has completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} has failed with error: ${err.message}`);
});

notificationWorker.on("completed", (job) => {
  console.log(`Notification job ${job.id} has completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`Notification job ${job?.id} has failed with error: ${err.message}`);
});

export { outboxWorker, pollAndProcessOutbox, startOutboxWorker, stopOutboxWorker };

/**
 * Gracefully close all workers
 * Call this during application shutdown
 */
export async function closeWorkers() {
  stopOutboxWorker();
  await domainEventsWorker.close();
  await emailWorker.close();
  await notificationWorker.close();
}

/**
 * Start all workers
 * Workers start automatically when created, but this function can be used
 * to ensure they're running or to restart after being paused
 */
export function startWorkers() {
  startOutboxWorker();
  console.log("Workers started");
  console.log("- Outbox worker: polling 'outbox_events' (FOR UPDATE SKIP LOCKED)");
  console.log("- Domain events worker: processing 'domain-events' queue");
  console.log("- Email worker: processing 'email' queue");
  console.log("- Notification worker: processing 'notification' queue");
}
