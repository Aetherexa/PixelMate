# Architecture Index

## Purpose
This index is the canonical map of PixelMate module boundaries, ownership, and dependency direction for Aetherexa Foundation v1.0 compliance.

## Topology
- apps/: runtime hosts and integration shells
- packages/: reusable domain and infrastructure modules
- tooling/: shared quality and developer tooling
- docs/: architecture and governance documentation

## Ownership Map
- apps/runtime-vscode/: Runtime Team
- packages/engine/: Platform Team
- packages/plugin-host/: Platform Team
- packages/event-bus/: Platform Team
- packages/state-machine/: Platform Team
- packages/storage/: Platform Team
- packages/renderer/: Platform Team
- packages/animation/: Platform Team
- packages/asset-loader/: Platform Team
- packages/shared/: Platform Team
- packages/types/: Platform Team
- docs/: Docs Team

## Public API Surfaces
- @aetherexa/animation -> packages/animation/src/index.ts
- @aetherexa/asset-loader -> packages/asset-loader/src/index.ts
- @aetherexa/engine -> packages/engine/src/index.ts
- @aetherexa/event-bus -> packages/event-bus/src/index.ts
- @aetherexa/plugin-host -> packages/plugin-host/src/index.ts
- @aetherexa/renderer -> packages/renderer/src/index.ts
- @aetherexa/shared -> packages/shared/src/index.ts
- @aetherexa/state-machine -> packages/state-machine/src/index.ts
- @aetherexa/storage -> packages/storage/src/index.ts
- @aetherexa/types -> packages/types/src/index.ts
- pixelmate-runtime-vscode command API -> pixelmate.alive

## Dependency Direction Rules
- apps may depend on packages
- packages must not depend on apps
- cross-package dependencies must remain explicit and justified
- cycles are prohibited
- packages expose only declared entrypoints via package.json exports

## Boundary and Stability Controls
- CODEOWNERS enforces ownership gates by folder
- CI enforces lint, typecheck, build, and tests
- commitlint enforces commit metadata consistency
- changesets governs release notes and version intent

## Architecture Decision Records
- Existing ADRs are maintained in docs/adr/
- Foundation top-level ADR entrypoint is adrs/README.md

## RFC and Decision Workflow
- RFC proposals are tracked in rfcs/
- Decision summaries are tracked in docs/decision-log/
- Meeting outcomes are tracked in meetings/

## Compliance Notes
- No architecture-breaking refactors were introduced in this migration.
- Existing package boundaries and public APIs are preserved.
