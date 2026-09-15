# SyncDocket

This file provides comprehensive context about the project, business domain, and architecture for AI assistants and engineers.

## Product Overview: What is SyncDocket?

**SyncDocket** is a B2B SaaS platform engineered to unify fragmented customer communications, CRM records, and order/courier dispatch into a single operational workspace.

### The Problem Solved: Operational Fragmentation

Modern businesses—particularly e-commerce brands and high-touch merchants—face severe operational fragmentation:

1. **Scattered Inboxes:** Customer conversations are split across isolated channels (WhatsApp, Facebook Messenger, Instagram Direct, live web chat, and email), forcing support staff to toggle multiple browser tabs and miss critical inquiries.
2. **Decoupled Data Silos:** Customer support agents answering chat inquiries have no direct visibility into order history, payment statuses, or past tickets without manually searching an external CRM or e-commerce admin panel.
3. **Friction in Dispatch & Fulfillment:** When an order is confirmed or modified inside a customer conversation, generating a delivery docket or booking a courier requires redundant copy-pasting across separate courier portals.
4. **Permission Chaos:** Businesses struggle to give junior support reps access to reply to customer chats without accidentally exposing store-wide financials, API secrets, or full order management capabilities.

SyncDocket eliminates this friction by bringing real-time communication, customer relationship data, and fulfillment logistics onto a single screen.

### Core Product Capabilities

1. **Unified Omnichannel Inbox**
   - Aggregates real-time inbound messages from WhatsApp, Facebook Messenger, Instagram, and web chat into a single stream.
   - Enables thread assignment, team collaboration, collision detection, and automated quick-replies.

2. **Contextual CRM & Customer 360**
   - Embeds customer profiles, order history, contact tags, and past interaction notes directly alongside the active conversation thread.
   - Allows support teams to update contact details and view purchase records in real time.

3. **Integrated Order & Courier Dispatch**
   - Allows agents to create manual orders, edit pending orders, and book courier parcels directly from within the chat window.
   - Generates structured delivery dockets, tracks shipment statuses, and pushes automated delivery notifications back into the customer's chat thread.

---

## UI & UX Principles: Customer Perspective First & Radical Minimalism

All AI assistants and engineers MUST adhere to these design and user experience standards:

1. **Customer Perspective First:**
   - Every interface must be designed for maximum operational speed and zero friction. Support reps and merchants handle dozens of interactions simultaneously; every unnecessary click, slow load, or confusing layout costs them real business.
2. **Radical Minimalism & Clean UI:**
   - Keep screens uncluttered and distraction-free. Strictly avoid useless decorative badges, animated gimmick pills, marketing filler, or redundant info cards on operational and auth screens.
   - Use subtle, focused ambient glow effects (`bg-primary` / emerald palette) and clean card borders rather than noisy decorations.
3. **Strict Viewport Discipline (Zero Accidental Scrollbars):**
   - Operational workspaces and authentication screens (login, signup, password reset, OTP) must fit within the active viewport (`h-dvh h-screen max-h-screen overflow-hidden`) without awkward page-level vertical scrollbars.
4. **Ponytail Rule (Simplicity & YAGNI):**
   - Build the simplest, shortest, most minimal solution that solves the user's problem. Never over-engineer UI or code.

---

## Tech Stack

- **Runtime**: bun
- **Package Manager**: bun

### Frontend

- Framework: next
- CSS: tailwind (Emerald primary palette)
- UI Library: shadcn-ui
- State: zustand

### Backend

- Framework: hono
- Validation: zod

### Database

- Database: postgres
- ORM: drizzle

### Additional Features

- Testing: vitest
- Email: plunk
- Job Queue: bullmq
- Caching: redis
- Logging: pino
- Observability: sentry

---

## Project Structure

```
syncdocket/
├── apps/
│   ├── app/         # Frontend application (Next.js, Tailwind, shadcn-ui)
│   └── server/      # Backend API (Modular Monolith with Vertical Slices)
├── docs/            # Engineering guides & Architecture Decision Records (ADRs)
├── packages/
│   ├── config/      # Shared config (Tailwind, Biome, TypeScript)
│   ├── db/          # Centralized Database schema & Drizzle migrations
│   ├── env/         # Environment variables & runtime validation
│   └── ui/          # Shared UI component library
```

---

## Common Commands

- `bun install` - Install dependencies
- `bun dev` - Start development server
- `bun build` - Build for production
- `bun test` - Run tests
- `bun db:push` - Push database schema
- `bun db:studio` - Open database UI

---

## Backend Architecture Standards: Modular Monolith & Vertical Slices

All backend development in `apps/server` MUST adhere to the **Modular Monolith & Vertical Slices** standard. Detailed reference is located in [`docs/engineering-guide.md`](docs/engineering-guide.md) and [`apps/server/AGENTS.md`](apps/server/AGENTS.md).

### 1. Mandatory Directory Structure
Modules live under `apps/server/src/modules/<domain>/`:
- `<domain>.manifest.ts` - Declarative contract: entitlements, permissions, operations metadata.
- `index.ts` - **ONLY** file other modules may import from (Public Contract).
- `schema.ts` - Module schema re-exports from `@syncdocket/db` (defined in `packages/db/src/schema/<domain>/`).
- `routes.ts` - Hono route definitions & middleware wiring ONLY (no business logic).
- `events/` - Domain event listeners & idempotency subscribers.
- `internal/` - Private domain services and clients (never imported externally).
- `features/<feature-name>/` - Vertical slice: `<name>.handler.ts`, `<name>.dto.ts`, `<name>.test.ts`.

### 2. Non-Negotiable Rules for AI Agents
1. **No Cross-Module Joins:** Never execute SQL joins across tables owned by different domains. Store references (e.g. `contactId: text("contact_id")`) and resolve via public contracts (`index.ts`) or domain events.
2. **Transactional Outbox for Events:** Never call `eventBus.publish()` bare after DB writes. All domain events MUST be inserted into an `outboxEvents` table inside the same `db.transaction()` as the state mutation.
3. **Idempotent Event Delivery:** All listeners must check a `processedEvents` ledger before executing side effects. Duplicate delivery will happen on retries.
4. **Dual-Gate Authorization:** Routes must gate on tenant feature entitlement (`requireFeature`) and user permissions (`requirePermission`). Never hardcode plan names (e.g. `plan === 'enterprise'`) in handlers.
5. **Strict Boundary Encapsulation:** External modules may only import from `apps/server/src/modules/<domain>/index.ts`. Direct access to another module's `internal/` or `features/` will fail CI boundary checks.
6. **Centralized Schemas & Migrations (Option A):** Drizzle schemas live in `packages/db/src/schema/<domain>/` and are re-exported by the module's `schema.ts`. `drizzle-kit` generates and applies migrations reliably in `packages/db/src/migrations/`.
7. **Cross-Module Aggregation:** Use BFF endpoints (`apps/server/src/bff/`) for stitching multi-module data on dashboards, or dedicated read-models / CQRS views for high-throughput queries.

### 3. Vertical Slice & Clean Code Standards
- **One request = One handler:** Handlers are the unit of transaction. Wrap multiple writes in `db.transaction()`.
- **Boundary Validation:** Every request body is parsed through a Zod DTO schema before reaching business logic.
- **Rule of Three:** Do not create shared services in `internal/` unless 3+ features genuinely require the identical logic.
- **HTTP Agnostic:** Internal services and handlers take/return plain TypeScript data, never `Request`/`Response` objects.
- **Business-First Naming:** Name folders and functions after real business actions (`dispatch-courier`), not technical layers.
- **ADRs:** Document non-trivial architectural decisions in `docs/adr/NNN-title.md` (see [`docs/adr/000-template.md`](docs/adr/000-template.md) and [`docs/adr/001-modular-monolith-and-vertical-slices.md`](docs/adr/001-modular-monolith-and-vertical-slices.md)).

---

## Better Fullstack project context

`bts.jsonc` is the authority for the current Stack Graph. Its `stackParts` array owns role selection and `ownerPartId` bindings. Top-level option fields are a compatibility projection and must not become a second mutation path.

### Stack Parts, ownership, and evidence

- `backend.backendUtilities:typescript:backend-utils`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.caching:typescript:redis`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.deploy:typescript:docker`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.email:typescript:plunk`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.fileStorage:typescript:r2`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.jobQueue:typescript:bullmq`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.logging:typescript:pino`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.observability:typescript:sentry`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.orm:typescript:drizzle`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.runtime:typescript:bun`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.testing:typescript:vitest`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.validation:typescript:zod`. It belongs to `backend:typescript:hono`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend:typescript:hono`. Its generated target is `apps/server`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `codeQuality:universal:biome`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `containerOrchestration:universal:docker-compose`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `continuousIntegration:universal:github-actions`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `database:universal:postgres`. Its generated target is `packages/db`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `documentation:universal:starlight`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.analytics:typescript:ga4`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.animation:typescript:framer-motion`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.appPlatform:typescript:pwa`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.css:typescript:tailwind`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.dataFetching:typescript:tanstack-query`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.deploy:typescript:docker`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.forms:typescript:react-hook-form`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.libraries:typescript:tanstack-table`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.libraries:typescript:tanstack-virtual`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.stateManagement:typescript:zustand`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.ui:typescript:shadcn-ui`. It belongs to `frontend:typescript:next`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend:typescript:next`. Its generated target is `apps/app`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `gitHooks:universal:lefthook`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `staticAnalysis:universal:gitleaks`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `testing:typescript:msw`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `workspaceRunner:universal:turborepo`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.

### Installed-version authority

Use `bts.jsonc` for the generator and schema version. Use local package manifests and lockfiles for installed dependency versions. Do not assume that documentation for a newer Better Fullstack release matches this project.

### Compatibility and lifecycle safety

Run `create-better-fullstack context --json` for bounded roles, capabilities, evidence, compatibility issues, and safe next actions. Run `create-better-fullstack doctor --json` before repairing graph drift. Existing-project writes must start with a plan and use the exact review token. Use `create-better-fullstack recipes check --json` before editing recipe-owned paths or managed regions, and use recipe history plus project recovery commands to undo a reviewed operation.

User code outside an explicit Better Fullstack managed region is not generator-owned. Missing or changed managed-region hashes stop recipe planning for manual review.

<!-- <better-fullstack:recipes sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855> -->

<!-- </better-fullstack:recipes> -->

## Maintenance

Keep AGENTS.md updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
