# AI Agent Guidelines & Architecture Rules for `apps/server`

> **Scope:** These rules and regulations are MANDATORY for all AI agents and engineers writing, refactoring, or building backend features in `apps/server`.  
> **Authority:** Derived from the living [Engineering Guide](../../docs/engineering-guide.md) and [ADR 001](../../docs/adr/001-modular-monolith-and-vertical-slices.md).

---

## 0. SyncDocket SaaS Product Overview

**SyncDocket** is a B2B SaaS platform engineered to unify fragmented customer communications, CRM records, and order/courier dispatch into a single operational workspace.

### The Problem Solved: Operational Fragmentation
1. **Scattered Inboxes:** Conversations split across WhatsApp, FB Messenger, Instagram Direct, web chat, and email, forcing support staff to toggle browser tabs and miss critical inquiries.
2. **Decoupled Data Silos:** Support reps lack immediate visibility into order history, payment status, or past tickets without switching to external admin panels.
3. **Friction in Dispatch & Fulfillment:** Creating delivery dockets or booking couriers from customer conversations requires redundant copy-pasting across courier portals.
4. **Permission Chaos:** Difficulty isolating sensitive financial data, full order management, or API secrets when granting chat access to junior support agents.

### Core Product Capabilities
1. **Unified Omnichannel Inbox:** Aggregates real-time messages (WhatsApp, Messenger, IG, Web Chat), team collaboration, thread assignment, collision detection, and automated quick-replies.
2. **Contextual CRM & Customer 360:** Embeds customer profiles, order history, contact tags, and interaction notes directly beside active chat threads.
3. **Integrated Order & Courier Dispatch:** In-chat order creation/modification, parcel booking, structured delivery docket generation, tracking status updates, and automated notifications back into the chat.

---

## UI & UX Principles: Customer Perspective First & Radical Minimalism

1. **Customer Perspective First:** Build fast, intuitive flows that eliminate repetitive actions for support teams and merchants.
2. **Radical Minimalism:** Strictly avoid visual clutter, arbitrary badges, decorative boxes, and marketing filler in operational views.
3. **Strict Viewport Discipline:** Core operational screens and auth views must stay locked to the viewport without unnecessary scrollbars (`h-dvh h-screen max-h-screen overflow-hidden`).
4. **Ponytail Rule (Simplicity & YAGNI):** Implement the simplest, cleanest solution with zero speculative complexity.

---

## 1. Core Architecture: Modular Monolith + Vertical Slices

Code in `apps/server` is organized around **business capabilities (modules)**, not technical layers.
- Modules own their data, schema, migrations, routes, and background events.
- Features inside modules are implemented as self-contained **Vertical Slices** (`features/<feature-name>/`).
- Modules NEVER directly access each other's databases or internal folders.

---

## 2. Directory Layout (Strict Enforcement)

Every domain capability must be located at `apps/server/src/modules/<domain>/`:

```text
apps/server/src/modules/<domain>/
├── <domain>.manifest.ts        # Declarative contract: entitlements, permissions, operations
├── index.ts                    # ONLY file other modules may import from (Public API)
├── schema.ts                   # Module schema re-exports from @syncdocket/db (packages/db/src/schema/<domain>/)
├── routes.ts                   # Hono route definitions & middleware wiring ONLY
├── events/                     # Domain event listeners & subscribers
│   ├── index.ts
│   └── <event-name>.listener.ts
├── internal/                   # Private domain services, third-party adapters (NEVER imported externally)
│   └── <service>.ts
└── features/                   # Vertical feature slices
    └── <feature-name>/
        ├── <feature-name>.handler.ts   # Core business execution & transactional unit
        ├── <feature-name>.dto.ts       # Zod validation schema & TypeScript types
        └── <feature-name>.test.ts      # Colocated integration test
```

### Naming Rule
The `<domain>` folder MUST represent a recognizable business capability (e.g. `inbox`, `billing`, `orders`, `notifications`, `tenants`). Never name a module after a technical layer (e.g. `controllers`, `helpers`, `services`).

---

## 3. Non-Negotiable Rules for AI Agents

### Rule 1: No Cross-Module SQL Joins
- ❌ **NEVER** write a join across tables owned by different modules (e.g. joining `inboxThreads` with `orders`).
- ✅ Store foreign IDs as plain text/uuid columns (`contactId: text("contact_id")`). Resolve relations via the owning module's public contract (`index.ts`) or domain events.

### Rule 2: Transactional Outbox for Events (No Bare Publishes)
- ❌ **NEVER** call `eventBus.publish()` directly after a database write. (A process crash between write and publish causes silent data loss).
- ✅ Write events into an `outboxEvents` table **inside the same database transaction** as your state mutation. A background worker will poll and publish them reliably.

```typescript
return await db.transaction(async (tx) => {
  const [record] = await tx.insert(records).values(data).returning();
  await tx.insert(outboxEvents).values({
    eventType: "domain.event.name",
    payload: { id: record.id, tenantId },
    status: "pending",
  });
  return record;
});
```

### Rule 3: Idempotent Event Listeners
- Background delivery can retry. Every event listener MUST check the `processedEvents` ledger before running side effects.
- Record the event ID inside a transaction before or alongside mutating domain state.

### Rule 4: Dual-Gate Authorization on Routes
Every route in `routes.ts` must pass through two gates:
1. **Gate 1: Feature Entitlement** (`requireFeature("domain:feature_key")`) — checks if tenant has purchased/enabled the capability.
2. **Gate 2: User Permission** (`requirePermission("domain:permission_key")`) — checks if the authenticated user has rights to perform the action.
- ❌ **NEVER** hardcode plan names (like `plan === 'enterprise'`) in handlers or routes. Use feature flags/entitlements from the manifest.

### Rule 5: Strict Module Boundary Encapsulation
- External modules may **ONLY** import from `apps/server/src/modules/<domain>/index.ts`.
- ❌ **NEVER** import from another module's `internal/`, `features/`, `schema.ts`, or `routes.ts`.

### Rule 6: Centralized Schemas & Single-Place Migrations (Option A)
- Drizzle schemas reside in `packages/db/src/schema/<domain>/` and are re-exported by the domain module's local `schema.ts`.
- `drizzle-kit` runs migrations reliably in a single place (`packages/db/src/migrations/`).
- Cross-module joins remain strictly forbidden; store reference IDs and resolve through events or public contracts.
- A handler or service must never execute raw SQL against tables owned by another domain.

---

## 4. Vertical Slice Anatomy

When building or updating a feature:
1. **DTO (`<feature-name>.dto.ts`)**:
   - Validate ALL inputs at the boundary using Zod.
   - Infer and export the DTO TypeScript type.
2. **Handler (`<feature-name>.handler.ts`)**:
   - The handler is the unit of transaction. Wrap all multiple writes in `db.transaction()`.
   - Keep handlers focused: one request, one handler, one execution path.
   - Do not call HTTP `Response` or `c.json()` in handlers. Return plain domain data or objects.
3. **Route Wiring (`routes.ts`)**:
   - Routes only parse the request, invoke middleware, call the handler, and return the response status.
   - No business logic in `routes.ts`.
4. **Integration Test (`<feature-name>.test.ts`)**:
   - Colocate tests with the feature.
   - Test handlers with real database fixtures, asserting both the state change and the queued outbox event.

---

## 5. Cross-Module Read Aggregation

If a dashboard or screen requires data from multiple modules:
- **Default:** Create a BFF (Backend-for-Frontend) endpoint in `apps/server/src/bff/` that queries the public contracts (`index.ts`) of the respective modules and combines them.
- **High-traffic/Sub-100ms:** Use a dedicated read-model / CQRS view updated by event subscribers.
- ❌ Do NOT combine modules ad-hoc via cross-module database joins.

---

## 6. The 7 Clean Code Principles

1. **Optimize for deletion, not reuse:** Prefer independent, easily removable vertical slices over premature abstractions.
2. **Rule of Three:** Do not extract code to `internal/` unless 3+ features in the module genuinely share the exact same logic.
3. **Boundary validation:** Validate everything with Zod at the input boundary.
4. **Unit of transaction:** Handlers own the transaction boundary (`db.transaction`).
5. **Entitlement keys, not tier names:** Use manifest feature keys (`inbox:whatsapp`), never tier names (`pro`, `enterprise`).
6. **HTTP-agnostic internal services:** Code in `internal/` or handlers must never accept or return `Request`/`Response` objects.
7. **Business-first naming:** Name files and functions after real business workflows (`dispatch-courier.ts`, not `update-status-helper.ts`).

---

## 7. Pre-Flight Checklist for New Features

Before completing any task in `apps/server`, verify:
- [ ] Feature is placed in `apps/server/src/modules/<domain>/features/<feature-name>/`.
- [ ] Input is validated via Zod schema in `<feature-name>.dto.ts`.
- [ ] Handler executes writes & outbox events inside a single `db.transaction()`.
- [ ] Route is wired in `routes.ts` with dual-gate middleware (`requireFeature` + `requirePermission`).
- [ ] No cross-module joins or illegal imports from other module internals.
- [ ] Colocated test exists and verifies the happy path + transactional outbox generation.
- [ ] Code passes formatting and linting: `bun run check`.
