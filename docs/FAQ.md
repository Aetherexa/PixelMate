# PixelMate FAQ

## Is PixelMate production-ready?

PixelMate is currently in public alpha (`v0.1.0-alpha`). The repository is engineering-grade and Foundation-certified, while product behavior systems are intentionally staged for future milestones.

## What does plugin-first mean in PixelMate?

Core engine capabilities are designed around explicit contracts and extension points so behavior can evolve via plugins without destabilizing core platform boundaries.

## Does this repository include companion behavior features?

No. This release focuses on architecture, quality, and runtime baseline readiness.

## Which runtime is currently available?

A VS Code runtime host is available in `apps/runtime-vscode` with an alive-check command.

## How do I contribute?

Start with CONTRIBUTING.md, open an issue via issue forms, and submit a PR with test and documentation updates.

## Where are architectural decisions tracked?

Current ADRs are in `docs/adr/` with top-level entrypoints in `adrs/` and `rfcs/`.

## How are security issues reported?

Report privately according to SECURITY.md and avoid public disclosure before coordinated triage.
