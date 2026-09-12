# 002: Centralized Drizzle Schemas per Module (Option A)

**Date:** 2026-09-12  
**Status:** Accepted  
**Deciders:** Engineering Team, AI Assistant Guidelines  

---

## Context
In ADR 001, database schemas were initially designed to be co-located inside each domain module under `apps/server/src/modules/<domain>/schema.ts` with isolated module migrations. While conceptually aligned with microservice independence, in a TypeScript/Bun modular monolith using Drizzle ORM (`drizzle-kit`), this created tooling friction:
- `drizzle-kit` requires a consolidated schema entrypoint and struggled with cross-package globs spanning multiple projects (`../../apps/server/src/modules/**/schema.ts`).
- Running migrations required ad-hoc custom runners iterating directory trees and applying raw SQL files outside Drizzle's transactional migration journal.
- Studio, push, and introspection tools (`bun run db:studio`, `bun run db:push`) expect a coherent database package.

## Decision
We adopt **Option A (Recommended for Monoliths)**:
1. **Centralized Drizzle Schemas:** All Drizzle table definitions live in `packages/db/src/schema/`, organized strictly into sub-folders per module (e.g. `packages/db/src/schema/auth/`, `packages/db/src/schema/inbox/`).
2. **Distinct Schema Exports:** `packages/db` exports schemas both distinctly (`authSchema`) and as a unified schema for Drizzle client relational queries.
3. **Module Local Re-Exports:** Each domain module's `schema.ts` (e.g. `apps/server/src/modules/auth/schema.ts`) re-exports its owned tables from `@syncdocket/db`. This maintains backward compatibility for vertical slices and handlers within that module.
4. **Single-Place Migrations:** `drizzle-kit` generates and runs migrations reliably in a single place (`packages/db/src/migrations/`).
5. **Boundary Invariance:** Centralizing Drizzle table definitions in `packages/db` does NOT permit cross-module joins. Rules against cross-domain SQL joins remain strictly non-negotiable. Modules continue communicating via public contracts (`index.ts`) and the Transactional Outbox.

## Consequences
### Positive
- `drizzle-kit generate`, `db:push`, `db:migrate`, and `db:studio` work reliably out of the box.
- Migrations are tracked in a unified, version-controlled journal in `packages/db/src/migrations/`.
- Domain grouping is preserved through directory organization (`packages/db/src/schema/<domain>/`).
- Simplifies dependency management and DB testing fixtures.

### Negative / Trade-offs
- Schema files for server modules are located in `packages/db/src/schema/<domain>/` rather than physically co-located in `apps/server/src/modules/<domain>/`.

## Compliance & Enforcement
- CI runs `bun run db:push` / `bun run check-types` across workspaces.
- AST boundaries and code reviews enforce that no module performs cross-domain SQL joins.

