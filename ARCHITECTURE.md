# Architecture

PixelMate follows clean architecture with strict package boundaries.

## Layers
- apps: runtime hosts and integration shells
- packages: reusable domain modules
- tooling: shared build and quality automation
- docs: authoritative architecture and contribution guidance

## Dependency Direction
Apps depend on packages.
Packages may depend on shared/types packages only where contracts require it.
No cyclic dependencies are permitted.

## Sprint 1 Scope
Sprint 1 delivers only production-grade engineering foundation and runtime host baseline.
No companion behavior, rendering systems, animation systems, or character logic are implemented.
