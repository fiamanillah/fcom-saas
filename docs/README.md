# SyncDocket Internal Documentation

Welcome to the internal engineering documentation for SyncDocket.

## Key Documents

- **[Engineering Guide](./engineering-guide.md)**: The authoritative guide for backend architecture, Modular Monolith design, Vertical Slice implementation, Transactional Outbox, Idempotency, Schema ownership, and Clean Code standards.
- **[Architecture Decision Records (ADRs)](./adr/)**:
  - [ADR Template](./adr/000-template.md)
  - [ADR 001: Modular Monolith and Vertical Slices for apps/server](./adr/001-modular-monolith-and-vertical-slices.md)

## Guidelines for Engineers & AI Agents

When contributing to `apps/server`:
1. Check [Engineering Guide](./engineering-guide.md) before designing or adding backend features.
2. Ensure new features are created as vertical slices in their respective business domain module under `apps/server/src/modules/<domain>/features/<feature-name>/`.
3. If introducing an architectural change or modifying module boundary rules, create an ADR in `docs/adr/`.

