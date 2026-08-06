# ADR 0001: Clean Architecture Baseline

## Status

Accepted

## Context

PixelMate must support long-term evolution across runtime hosts and companion packs.

## Decision

Adopt clean architecture with strict dependency flow:

- Contracts -> Core -> Infrastructure
- Runtime hosts consume package public APIs only

## Consequences

- Higher initial design effort
- Lower long-term rewrite risk
- Stronger testability and replaceability
