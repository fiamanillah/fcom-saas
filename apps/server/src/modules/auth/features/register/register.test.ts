import { describe, expect, it, vi } from "vitest";

// Mock @syncdocket/db for unit & integration testing without external Postgres requirement
vi.mock("@syncdocket/db", async () => {
  const { users } = await import("@syncdocket/db/schema/auth");
  const { outboxEvents } = await import("@syncdocket/db/schema/outbox");

  const existingUsers: Array<{ id: string; email: string }> = [
    { id: "existing-id", email: "existing@example.com" },
  ];
  const insertedEvents: Array<Record<string, unknown>> = [];

  const mockTx = {
    insert: vi.fn((_table: unknown) => ({
      values: vi.fn((vals: Record<string, unknown>) => {
        if (vals.passwordHash) {
          const userRecord = {
            id: "user-uuid-123",
            email: vals.email as string,
            name: (vals.name as string | undefined) ?? null,
            role: (vals.role as string | undefined) ?? "user",
            createdAt: new Date(),
          };
          existingUsers.push({ id: userRecord.id, email: userRecord.email });
          return {
            returning: vi.fn().mockResolvedValue([userRecord]),
          };
        }
        // outbox event
        insertedEvents.push(vals);
        return Promise.resolve([vals]);
      }),
    })),
  };

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn((condition: { queryChunks?: Array<{ value?: unknown }> }) => {
          let email = "";
          if (condition?.queryChunks) {
            for (const chunk of condition.queryChunks) {
              if (chunk && typeof chunk.value === "string") {
                email = chunk.value;
                break;
              }
            }
          }
          return {
            limit: vi.fn().mockImplementation(() => {
              const match = existingUsers.find((u) => u.email === email);
              return Promise.resolve(match ? [{ id: match.id }] : []);
            }),
          };
        }),
      })),
    })),
    transaction: vi.fn(
      async (callback: (tx: typeof mockTx) => Promise<unknown>) => await callback(mockTx),
    ),
  };

  return {
    db: mockDb,
    users,
    outboxEvents,
    authOutboxEvents: outboxEvents,
  };
});

import app from "@/index";
import {
  hashPassword,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
} from "../../internal/security";
import { registerSchema } from "./register.dto";
import { registerHandler } from "./register.handler";

describe("Auth Module: Register Feature", () => {
  describe("DTO validation (registerSchema)", () => {
    it("accepts valid registration input", () => {
      const valid = {
        email: "alice@example.com",
        password: "securePassword123",
        name: "Alice Doe",
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("alice@example.com");
      }
    });

    it("rejects invalid email addresses", () => {
      const invalid = {
        email: "not-an-email",
        password: "securePassword123",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects password with fewer than 8 characters", () => {
      const invalid = {
        email: "alice@example.com",
        password: "short",
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Security utilities", () => {
    it("hashes and verifies passwords using native Bun.password", async () => {
      const password = "mySecurePassword!9";
      const hash = await hashPassword(password);

      expect(hash).toContain("$argon2id$");
      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword("wrongPassword", hash)).toBe(false);
    });

    it("signs and verifies JWT access tokens using hono/jwt", async () => {
      const payload = { sub: "user-123", email: "alice@example.com", role: "user" };
      const token = await signAccessToken(payload);

      expect(typeof token).toBe("string");
      const decoded = await verifyAccessToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe("user-123");
      expect(decoded?.email).toBe("alice@example.com");
      expect(decoded?.role).toBe("user");
    });

    it("returns null on invalid token verification", async () => {
      const invalid = await verifyAccessToken("invalid.token.structure");
      expect(invalid).toBeNull();
    });
  });

  describe("Handler business logic", () => {
    it("registers user, creates transactional outbox event, and issues token", async () => {
      const result = await registerHandler({
        email: "bob@example.com",
        password: "password1234",
        name: "Bob Builder",
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("bob@example.com");
      expect(result.user.name).toBe("Bob Builder");
      expect("passwordHash" in result.user).toBe(false); // Never expose password hash
      expect(result.token).toBeDefined();

      const decoded = await verifyAccessToken(result.token);
      expect(decoded?.email).toBe("bob@example.com");
    });

    it("throws 409 ApiError when email already exists", async () => {
      await expect(
        registerHandler({
          email: "existing@example.com",
          password: "password1234",
        }),
      ).rejects.toThrow("already exists");
    });
  });

  describe("HTTP Route integration (POST /auth/register)", () => {
    interface SuccessBody {
      success: true;
      data: {
        user: { email: string };
        token: string;
      };
    }

    interface ErrorBody {
      success: false;
      error: string;
    }

    it("returns 201 Created on versioned route /api/v1/auth/register", async () => {
      const res = await app.request("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "charlie@example.com",
          password: "password1234",
          name: "Charlie",
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as SuccessBody;
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe("charlie@example.com");
      expect(data.data.token).toBeDefined();
    });

    it("returns 201 Created on backwards-compatible route /auth/register", async () => {
      const res = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "charlie.alias@example.com",
          password: "password1234",
          name: "Charlie Alias",
        }),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as SuccessBody;
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe("charlie.alias@example.com");
    });

    it("returns 400 Bad Request on validation failure", async () => {
      const res = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "not-an-email",
          password: "short",
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as ErrorBody;
      expect(data.success).toBe(false);
      expect(data.error).toBe("Validation failed");
    });
  });
});
