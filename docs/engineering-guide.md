# SaaS Engineering Guide: Modular Monolith, Vertical Slices & Clean Code Standards

**Status:** Living document — update via ADRs (see Section 9)  
**Audience:** All engineers and AI agents contributing to `apps/server`

---

## 0. Philosophy in One Paragraph

We organize code around **business capabilities (modules)**, not technical layers. Each module owns its data, exposes a single typed contract, and communicates with other modules only through events or public interfaces — never through direct database access. Inside each module, features are implemented as **vertical slices**: one request, one handler, one clear execution path. This gives us the maintainability of microservices with the operational simplicity of a monolith, and a clean extraction path if/when we need to split a module out.

---

## 1. Directory Structure (Mandatory)

Every domain capability in `apps/server` MUST follow this exact directory structure:

```text
apps/server/src/modules/<domain>/
├── <domain>.manifest.ts        # Declarative contract: entitlements, permissions, ops metadata
├── index.ts                    # ONLY file other modules may import from
├── schema.ts                   # Module schema re-exports from @syncdocket/db (packages/db/src/schema/<domain>/)
├── routes.ts                   # Hono route definitions & middleware assembly
├── events/
│   ├── index.ts
│   └── <event-name>.listener.ts
├── internal/                   # Private services, third-party clients — never imported externally
│   └── <service>.ts
└── features/
    └── <feature-name>/
        ├── <feature-name>.handler.ts
        ├── <feature-name>.dto.ts
        └── <feature-name>.test.ts   # Integration test, colocated
```

**Rule:** If you can't name the folder after a business capability a non-engineer would recognize (`inbox`, `billing`, `orders`, `notifications`), it is not a module — it is a layer in disguise. Rename it.

---

## 2. The Module Contract

### 2.1 Manifest — declares *what*, never *how much it costs*

The manifest defines the module's identity, public routes, entitlements, permissions, and operational footprint:

```typescript
// modules/inbox/inbox.manifest.ts
export const inboxManifest = {
  id: "inbox",
  name: "Unified Inbox",
  basePath: "/inbox",

  entitlements: {
    features: [
      { key: "inbox:whatsapp", label: "WhatsApp Multi-Device" },
    ],
    quotas: [
      { key: "quota:monthly_messages", label: "Monthly Outbound Messages", default: 500 },
    ],
  },

  permissions: {
    tenant: [
      { key: "inbox:read", label: "View Messages" },
      { key: "inbox:reply", label: "Send Replies" },
    ],
    platform: [
      { key: "platform:inbox_supervision", label: "Inbox Diagnostics" },
    ],
  },

  operations: {
    queues: ["inbox-webhooks", "inbox-outbound"],
    auditCategory: "INBOX",
    metricsPrefix: "inbox_",     // required — see Section 6
  },
} as const;
```

Pricing tiers live in the database and reference these keys. **Never** hardcode a plan name inside a handler.

### 2.2 Public contract (`index.ts`)

The root `index.ts` of the module is the **only** entrypoint that outside code may import from.

```typescript
// modules/inbox/index.ts
export { inboxManifest } from "./inbox.manifest";
export { inboxRoutes } from "./routes";

export interface InboxContract {
  sendSystemNotification(tenantId: string, threadId: string, text: string): Promise<void>;
}

class InboxModuleService implements InboxContract {
  async sendSystemNotification(tenantId: string, threadId: string, text: string) {
    // internal execution
  }
}

export const inboxModule: InboxContract = new InboxModuleService();
```

**Treat this file like a public API with semver discipline.** Breaking a method signature here breaks every consumer silently unless types are airtight. Any change here needs the same review rigor as a public API change — flag it explicitly in the PR description.

---

## 3. Vertical Slices — Feature Anatomy

Every feature = one folder, one handler, one DTO, one test. No shared "generic service" layer inside a module unless at least 3 features need the identical logic (Rule of Three).

### DTO (`<feature-name>.dto.ts`)
```typescript
// features/send-reply/send-reply.dto.ts
import { z } from "zod";

export const sendReplySchema = z.object({
  threadId: z.string().uuid(),
  messageText: z.string().min(1).max(4096),
  attachments: z.array(z.string().url()).optional(),
});

export type SendReplyDTO = z.infer<typeof sendReplySchema>;
```

### Handler (`<feature-name>.handler.ts`)
```typescript
// features/send-reply/send-reply.handler.ts
import { db } from "@syncdocket/db";
import { messages } from "../../schema";
import { outboxEvents } from "../../schema"; // or shared outbox table
import type { SendReplyDTO } from "./send-reply.dto";

export async function sendReplyHandler(tenantId: string, userId: string, dto: SendReplyDTO) {
  return await db.transaction(async (tx) => {
    const [message] = await tx.insert(messages).values({
      tenantId,
      senderId: userId,
      threadId: dto.threadId,
      body: dto.messageText,
      status: "pending",
    }).returning();

    await tx.insert(outboxEvents).values({
      eventType: "inbox.message.queued",
      payload: { tenantId, messageId: message.id },
      status: "pending",
    });

    return message;
  });
}
```

> [!IMPORTANT]
> The transaction MUST wrap **both** the state write and the outbox event insertion. This ensures atomic persistence without partial state leaks or lost events.

---

## 4. Inter-Module Communication (Non-Negotiable Rules)

### Rule 1 — No cross-module joins, ever
```typescript
// ❌ NEVER JOIN ACROSS DOMAIN BOUNDARIES
db.select().from(inboxThreads).innerJoin(orders, ...)

// ✅ Store reference IDs, resolve via the owning module's public contract or asynchronous events
contactId: text("contact_id")
```

### Rule 2 — Events go through the Transactional Outbox, not a bare publish

A bare `eventBus.publish()` after a DB write is a silent data-loss bug waiting to happen (crash between insert and publish = lost event forever). Use the outbox table + poller pattern:

```typescript
// Shared table, one per service instance
outboxEvents: {
  id: uuid,
  eventType: string,
  payload: jsonb,
  status: "pending" | "sent" | "failed",
  attempts: integer,
  createdAt: timestamp,
  sentAt: timestamp | null
}
```

A background worker polls `outboxEvents` where `status = 'pending'`, publishes to the real message bus/queue (e.g., Redis / BullMQ), and marks `sent` only on confirmed delivery, with exponential backoff retries and a dead-letter path after N failures.

### Rule 3 — Every listener must be idempotent

Retries mean duplicate delivery **will** happen. Every listener must verify a `processedEvents` ledger before executing side effects:

```typescript
// events/order-dispatched.listener.ts
import { db } from "@syncdocket/db";
import { processedEvents } from "../../schema";
import { eq } from "drizzle-orm";

export async function onOrderDispatched(event: OrderDispatchedEvent) {
  const seen = await db.query.processedEvents.findFirst({
    where: eq(processedEvents.eventId, event.id),
  });
  if (seen) return;

  await db.transaction(async (tx) => {
    await tx.insert(processedEvents).values({ eventId: event.id });
    // Execute idempotent business logic here
  });
}
```

### Rule 4 — Dual-gate authorization on every route

Every domain route must explicitly enforce tenant capability gating AND user permission checks:

```typescript
router.post("/inbox/reply",
  requireFeature("inbox:whatsapp"),   // Gate 1: Tenant plan entitlement
  requirePermission("inbox:reply"),   // Gate 2: User authorization
  sendReplyController
);
```

---

## 5. Schema & Migration Ownership (Option A: Centralized per Module)

- Drizzle ORM schemas are centralized under `packages/db/src/schema/`, strictly organized into sub-folders per module (e.g. `packages/db/src/schema/auth/`, `packages/db/src/schema/inbox/`).
- Each module's schema is exported distinctly from `@syncdocket/db` (e.g., `authSchema`), and re-exported by the domain module's local `schema.ts`.
- `drizzle-kit` runs migrations reliably in a single place (`packages/db/src/migrations/`).
- **Strict Boundary Rule:** Centralizing table definitions in `packages/db` does NOT permit cross-module SQL joins. Never execute joins across domain boundaries; store reference IDs and resolve via public contracts (`index.ts`) or asynchronous events.
- No module may execute raw SQL against another module's tables.

---

## 6. Observability (Required From Day One, Not Retrofitted)

Every module declares `metricsPrefix` in its manifest. Every feature handler must emit, at minimum:

- `<prefix>_handler_duration_ms` (histogram, tagged by `tenantId` + `feature`)
- `<prefix>_handler_success_total` / `<prefix>_handler_failure_total`
- Structured logs with `tenantId`, `module`, `feature`, `traceId`

Without this, once you have 20+ modules, nobody can answer "why is the app slow right now" without guessing. Wire this into a shared middleware in `src/lib/observability.ts` so individual handlers don't need to remember to call it — make the correct behavior the default.

---

## 7. Cross-Module Read Aggregation

"Let the frontend combine API calls" does not scale past a couple of screens. Pick one strategy per use case and be explicit about which:

| Strategy | When to use | Implementation |
|---|---|---|
| **BFF endpoint** (`apps/server/src/bff/`) | Dashboards or detail views needing 2–3 modules' data | Calls each module's public contract (`index.ts`) and stitches results server-side |
| **Read-model / Materialized View** | High-traffic dashboards, analytics, sub-100ms reads across many modules (CQRS-lite) | A dedicated `reporting` module subscribes to domain events and updates a denormalized read table |

> [!WARNING]
> Never let this be decided ad hoc per feature. If a screen needs data from more than one module, it goes through a BFF endpoint — full stop.

---

## 8. Boundary Enforcement (Automated, Not Just Documented)

Enforce modular isolation in code analysis and linting:

```json
// biome.json: linter.rules.style.noRestrictedImports
"noRestrictedImports": {
  "level": "error",
  "options": {
    "patterns": [
      {
        "group": [
          "@/modules/*/internal/*",
          "@/modules/*/internal/**",
          "@/modules/*/internal",
          "@/modules/*/features/*",
          "@/modules/*/features/**",
          "@/modules/*/features"
        ],
        "message": "Import only from the module root index.ts."
      }
    ]
  }
}
```

A dedicated AST linter (`scripts/check-module-boundaries.ts`) runs on every commit via **Lefthook** (`pre-commit`) and in **GitHub Actions CI** (`bun run check:boundaries`). It catches both static and dynamic cross-module imports traversing via path aliases (`@/modules/*`) or relative paths (`../other-module/internal/*`).


---

## 9. Architecture Decision Records (ADRs)

Every non-trivial architectural or domain boundary decision gets a file in `docs/adr/NNN-title.md`:

```markdown
# 003: Transactional Outbox for Cross-Module Events

## Context
Bare eventBus.publish() calls could silently lose events on process crash.

## Decision
All domain events are written to an `outboxEvents` table in the same
transaction as the state change, and published by a separate poller.

## Consequences
+ No lost events even on crash
- Slight publish latency (polling interval)
- Requires a new worker process
```

This prevents the same debate ("why don't we just join across schemas, it'd be faster") from being re-litigated every few months by someone new.

---

## 10. Testing Strategy

- **One integration test per feature handler**, run against a real test database (Testcontainers/Docker), not mocked repositories. The handler is the unit of behavior in vertical slice architecture — test it as a whole.
- **Every event listener test must cover the duplicate-delivery case** (call it twice, assert side effects happened once).
- **Every PR touching a handler must answer**:
  1. What happens if the DB write succeeds but the outbox publish fails?
  2. What happens if the listener throws halfway through?
  If the PR description can't answer this, it's not done.

```typescript
describe("sendReplyHandler", () => {
  it("creates message and enqueues outbox event", async () => {
    const result = await sendReplyHandler(tenantId, userId, dto);
    expect(result.status).toBe("pending");
    expect(await db.query.outboxEvents.findFirst(...)).toBeDefined();
  });
});

describe("onOrderDispatched", () => {
  it("is idempotent on duplicate delivery", async () => {
    await onOrderDispatched(event);
    await onOrderDispatched(event); // duplicate event invocation
    const count = await countSideEffects();
    expect(count).toBe(1);
  });
});
```

---

## 11. General Clean Code Rules (Apply Inside Every Slice)

1. **Optimize for deletion, not reuse.** A feature you can delete in one PR without breaking others is worth more than a clever shared abstraction. Don't extract shared code until 3 features genuinely need it (Rule of Three).
2. **No business logic in `routes.ts`.** Routes wire middleware and call the handler — nothing else.
3. **DTOs validate at the boundary, always.** Every handler's input is parsed through a Zod schema before touching business logic; never trust raw request bodies past the DTO layer.
4. **Handlers are the unit of transaction.** If a handler does more than one write, it's wrapped in `db.transaction()`. No partial writes leak out of a handler.
5. **No `if (tenant.plan === 'enterprise')` in handlers.** Always go through `requireFeature()` / `requirePermission()` middleware, backed by the manifest.
6. **Internal services (`internal/`) have no knowledge of HTTP.** They take/return domain data, not `Request`/`Response` objects — keeps them portable if the module is later extracted to a microservice.
7. **Naming mirrors the business, not the tech.** `dispatch-courier`, not `update-order-status-v2`.

---

## 12. Pre-Extraction Checklist (Before Ever Splitting a Module Into a Microservice)

Do **not** attempt microservice extraction until every single box is checked:

- [ ] Module has zero shared DB transactions with any other module
- [ ] Module has zero cron jobs referencing another module's tables directly
- [ ] All cross-module calls go through the outbox/event bus or the public contract — verified via boundary check (`bun run check:boundaries`), not assumption
- [ ] Module's event contract (event names + payload shapes) is documented and versioned
- [ ] Observability (Section 6) already shows this module's real load/latency independent of others

If any box is unchecked, extraction will surface hidden coupling in production, not in code review.

---

## 13. Quick Reference — What Goes Where

| I want to... | Do this |
|---|---|
| Add a new business capability | Create a new module folder under `apps/server/src/modules/<domain>/` with manifest + `index.ts` |
| Add a new action inside a domain | Add a new `features/<name>/` slice with `.dto.ts`, `.handler.ts`, and `.test.ts` |
| Share logic across 3+ features in the same module | Extract to `internal/` — not before |
| React to something happening in another module | Add a listener in `events/`, subscribe via outbox-backed event bus |
| Show data from 2+ modules on one screen | Add a BFF endpoint under `apps/server/src/bff/` — never join tables |
| Gate a feature by pricing plan | Add an entitlement key to the manifest + `requireFeature()` |
| Gate a feature by user role | Add a permission key to the manifest + `requirePermission()` |
| Change a module's schema | Add a migration inside that module's own `migrations/` folder |

