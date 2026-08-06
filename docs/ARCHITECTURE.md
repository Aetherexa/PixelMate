# Architecture Guide

PixelMate Engine follows Clean Architecture and Domain-Driven principles.

## High-Level Design

```mermaid
flowchart LR
  RH[Runtime Host] --> E[PixelMate Engine Core]
  E --> PH[Plugin Host]
  PH --> P1[Built-in Plugins]
  PH --> P2[Future Plugins]
  E --> EB[Typed Event Bus]
  E --> SS[Subsystem Contracts]
  SS --> INF[Default Infrastructure Adapters]
```

## Dependency Rule

- Contracts define boundaries.
- Core orchestrates use cases.
- Infrastructure implements contracts.
- Runtime hosts consume only the public engine API.

## Event-Driven Communication

Subsystems and plugins communicate through `EventBus<EngineEventMap>`.

## Replaceability

Each subsystem can be replaced by overriding concrete implementations in composition.

## Startup Sequence

```mermaid
sequenceDiagram
  participant Host as Runtime Host
  participant Factory as Engine Factory
  participant Core as Engine Core
  participant PH as Plugin Host
  Host->>Factory: createPixelMateEngine()
  Factory->>Core: instantiate core + deps
  Host->>Core: start()
  Core->>PH: register built-in plugins
  PH-->>Core: PluginLoaded events
```
