import { beforeEach, describe, expect, it, vi } from "vitest";
import { IdempotencyManager } from "@/lib/idempotency";
import { onUserRegistered, type UserRegisteredEvent } from "./user-registered.listener";

vi.mock("@/lib/idempotency", () => ({
  IdempotencyManager: {
    acquire: vi.fn(),
    complete: vi.fn(),
    release: vi.fn(),
  },
}));

describe("user-registered.listener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEvent: UserRegisteredEvent = {
    id: "evt-user-123",
    eventType: "auth.user.registered",
    payload: {
      userId: "u-123",
      email: "user@example.com",
      name: "Test User",
    },
  };

  it("processes new event and marks completed in IdempotencyManager", async () => {
    (IdempotencyManager.acquire as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await onUserRegistered(mockEvent);

    expect(IdempotencyManager.acquire).toHaveBeenCalledWith("evt-user-123");
    expect(IdempotencyManager.complete).toHaveBeenCalledWith("evt-user-123");
    expect(IdempotencyManager.release).not.toHaveBeenCalled();
  });

  it("drops duplicate event immediately without executing side-effects", async () => {
    (IdempotencyManager.acquire as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    await onUserRegistered(mockEvent);

    expect(IdempotencyManager.acquire).toHaveBeenCalledWith("evt-user-123");
    expect(IdempotencyManager.complete).not.toHaveBeenCalled();
    expect(IdempotencyManager.release).not.toHaveBeenCalled();
  });

  it("releases lease on unhandled failure so BullMQ retry can re-attempt", async () => {
    (IdempotencyManager.acquire as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (IdempotencyManager.complete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Unexpected failure during processing"),
    );

    await expect(onUserRegistered(mockEvent)).rejects.toThrow("Unexpected failure");

    expect(IdempotencyManager.release).toHaveBeenCalledWith("evt-user-123");
  });
});
