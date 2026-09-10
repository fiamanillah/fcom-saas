# 001: Modular Monolith and Vertical Slices for apps/server

**Date:** 2026-09-10  
**Status:** Accepted  
**Deciders:** Engineering Team, AI Assistant Guidelines  

---

## Context
As the SaaS backend grows in capability and business complexity, traditional layered architectures (global `controllers/`, `services/`, `models/`) cause tight coupling, accidental dependency entanglement, leaky abstraction layers, and high cognitive load. Conversely, distributed microservices at this stage introduce unwarranted operational friction, distributed network latency, deployment overhead, and premature operational complexity.

## Decision
We organize `apps/server` as a **Modular Monolith with Vertical Slice Architecture**:
1. Code is partitioned by **business capability (domain modules)** under `apps/server/src/modules/<domain>/`.
2. Each domain module owns its private schema, migrations, internal services, and events.
3. Modules interact with external modules **exclusively** via their typed public contract (`index.ts`) or asynchronous domain events through a **Transactional Outbox**.
4. Direct database joins across domain boundaries are strictly forbidden.
5. Within each module, features are implemented as **vertical slices** (`features/<feature-name>/`) with co-located DTO, handler, and integration tests.
6. Route handlers enforce dual-gate authorization: tenant feature entitlement (`requireFeature`) and user permission (`requirePermission`).
7. Listeners for domain events must be strictly idempotent with a `processedEvents` ledger.

## Consequences
### Positive
- High cohesion and low coupling across business capabilities.
- Simple operational model (single monolithic deployment with clean boundaries).
- High velocity and easy deletion/modification of features (isolated vertical slices).
- Clean, friction-free microservice extraction path if individual domain scaling becomes necessary.
- Prevention of distributed data loss via the Transactional Outbox pattern.

### Negative / Trade-offs
- No cross-module SQL joins allowed; queries spanning domains must use BFF endpoints or read-models/CQRS.
- Outbox worker process and polling/queue infrastructure required.
- Requires strict adherence and automated boundary enforcement (ESLint/Biome/dependency-cruiser) to prevent accidental direct imports of internal module paths.

## References
- See [Engineering Guide](../engineering-guide.md)

