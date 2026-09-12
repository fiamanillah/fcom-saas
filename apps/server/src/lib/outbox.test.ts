import { beforeEach, describe, expect, it, vi } from "vitest";
import { OutboxWorker, pollAndProcessOutbox, startOutboxWorker, stopOutboxWorker } from "./outbox";
import { domainEventsQueue } from "./queue";

// Mock pending outbox rows
const mockPendingRows = [
  {
    id: "event-1",
    eventType: "auth.user.registered",
    payload: { userId: "u1", email: "u1@test.com" },
    attempts: 0,
    createdAt: new Date(),
  },
  {
    id: "event-2",
    eventType: "order.created",
    payload: { orderId: "o1", amount: 100 },
    attempts: 0,
    createdAt: new Date(),
  },
];

let deletedIds: string[] = [];
let updatedRecords: Array<Record<string, unknown>> = [];
let forUpdateCalls: Array<{ mode: string; options: unknown }> = [];

const mockTx = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn((_limit: number) => ({
          for: vi.fn((mode: string, options: unknown) => {
            forUpdateCalls.push({ mode, options });
            return Promise.resolve([...mockPendingRows]);
          }),
        })),
      })),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn((_condition: unknown) => {
      deletedIds.push(...mockPendingRows.map((r) => r.id));
      return Promise.resolve(deletedIds);
    }),
  })),
  update: vi.fn(() => ({
    set: vi.fn((vals: Record<string, unknown>) => ({
      where: vi.fn((_condition: unknown) => {
        updatedRecords.push(vals);
        return Promise.resolve(updatedRecords);
      }),
    })),
  })),
};

vi.mock("@syncdocket/db", () => ({
  db: {
    transaction: vi.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
  },
  outboxEvents: {
    id: "id",
    eventType: "event_type",
    payload: "payload",
    status: "status",
    attempts: "attempts",
    lastError: "last_error",
    createdAt: "created_at",
  },
}));

vi.mock("@syncdocket/infra/logger", () => ({
  createChildLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock("./queue", () => ({
  redis: {
    set: vi.fn(),
    del: vi.fn(),
  },
  domainEventsQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-id" }),
    addBulk: vi.fn().mockResolvedValue([{ id: "job-1" }, { id: "job-2" }]),
    on: vi.fn(),
  },
  emailQueue: { on: vi.fn() },
  notificationQueue: { on: vi.fn() },
}));

describe("Ephemeral Outbox Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deletedIds = [];
    updatedRecords = [];
    forUpdateCalls = [];
  });

  describe("processBatch", () => {
    it("locks pending records atomically using FOR UPDATE SKIP LOCKED", async () => {
      const dispatched = await pollAndProcessOutbox({ batchSize: 50 });

      expect(dispatched).toBe(2);
      expect(forUpdateCalls).toHaveLength(1);
      expect(forUpdateCalls[0]).toEqual({
        mode: "update",
        options: { skipLocked: true },
      });
    });

    it("publishes events to BullMQ in bulk with deterministic deduplication jobId", async () => {
      await pollAndProcessOutbox();

      expect(domainEventsQueue.addBulk).toHaveBeenCalledTimes(1);
      expect(domainEventsQueue.addBulk).toHaveBeenCalledWith([
        {
          name: "auth.user.registered",
          data: {
            id: "event-1",
            eventType: "auth.user.registered",
            payload: { userId: "u1", email: "u1@test.com" },
          },
          opts: { jobId: "event-1" },
        },
        {
          name: "order.created",
          data: {
            id: "event-2",
            eventType: "order.created",
            payload: { orderId: "o1", amount: 100 },
          },
          opts: { jobId: "event-2" },
        },
      ]);
    });

    it("deletes delivered events immediately upon confirmed BullMQ handoff (zero bloat)", async () => {
      await pollAndProcessOutbox();

      expect(mockTx.delete).toHaveBeenCalledTimes(1);
      expect(deletedIds).toContain("event-1");
      expect(deletedIds).toContain("event-2");
    });

    it("handles batch with zero pending events gracefully without calling addBulk", async () => {
      mockTx.select.mockReturnValueOnce({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              for: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      } as unknown as ReturnType<typeof mockTx.select>);

      const dispatched = await pollAndProcessOutbox();
      expect(dispatched).toBe(0);
      expect(domainEventsQueue.addBulk).not.toHaveBeenCalled();
      expect(mockTx.delete).not.toHaveBeenCalled();
    });

    it("increments attempts and records lastError when BullMQ delivery fails", async () => {
      (domainEventsQueue.addBulk as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Redis connection failure"),
      );

      const dispatched = await pollAndProcessOutbox();

      expect(dispatched).toBe(0);
      expect(mockTx.delete).not.toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalledTimes(2);
      expect(updatedRecords[0]).toMatchObject({
        attempts: 1,
        lastError: "Redis connection failure",
      });
    });
  });

  describe("OutboxWorker lifecycle", () => {
    it("starts and stops cleanly without unhandled errors", async () => {
      const worker = new OutboxWorker({ fallbackPollIntervalMs: 10000 });
      await worker.start();
      await worker.stop();
    });

    it("exported helpers control singleton worker", () => {
      startOutboxWorker();
      stopOutboxWorker();
    });
  });
});
