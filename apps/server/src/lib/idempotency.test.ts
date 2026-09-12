import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdempotencyManager } from "./idempotency";
import { redis } from "./queue";

vi.mock("./queue", () => ({
  redis: {
    set: vi.fn(),
    del: vi.fn(),
  },
  emailQueue: { on: vi.fn() },
  notificationQueue: { on: vi.fn() },
  domainEventsQueue: { on: vi.fn() },
}));

describe("IdempotencyManager (Redis-backed O(1))", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("acquires lease on new event ID", async () => {
    (redis.set as ReturnType<typeof vi.fn>).mockResolvedValue("OK");

    const result = await IdempotencyManager.acquire("evt-100", 60);

    expect(result).toBe(true);
    expect(redis.set).toHaveBeenCalledWith("evt:seen:evt-100", "processing", "EX", 60, "NX");
  });

  it("rejects lease if event is already seen / processing", async () => {
    (redis.set as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await IdempotencyManager.acquire("evt-100");

    expect(result).toBe(false);
  });

  it("marks event as completed with 24-hour retention", async () => {
    (redis.set as ReturnType<typeof vi.fn>).mockResolvedValue("OK");

    await IdempotencyManager.complete("evt-100", 86400);

    expect(redis.set).toHaveBeenCalledWith("evt:seen:evt-100", "completed", "EX", 86400);
  });

  it("releases key so retry can re-acquire immediately", async () => {
    (redis.del as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    await IdempotencyManager.release("evt-100");

    expect(redis.del).toHaveBeenCalledWith("evt:seen:evt-100");
  });

  it("fails open gracefully if Redis is temporarily unreachable", async () => {
    (redis.set as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Redis connection down"));

    const result = await IdempotencyManager.acquire("evt-error");

    // Fail-safe: does not block execution pipeline
    expect(result).toBe(true);
  });
});
