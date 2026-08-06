# ADR 0003: Engine-Runtime Separation

## Status

Accepted

## Context

PixelMate engine must be reusable across hosts, not tied to VS Code.

## Decision

Place host bindings in dedicated runtime packages (e.g., `runtime-vscode`) and keep engine host-agnostic.

## Consequences

- Runtime-specific testing remains isolated
- Engine can be reused by CLI, desktop, and web hosts
