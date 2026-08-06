# PixelMate Architecture Diagram

This diagram captures the current alpha architecture and dependency direction.

```mermaid
flowchart TD
  RH[apps/runtime-vscode]\nRuntime Host --> ENG[@aetherexa/engine]

  ENG --> PH[@aetherexa/plugin-host]
  ENG --> EB[@aetherexa/event-bus]
  ENG --> SM[@aetherexa/state-machine]
  ENG --> ST[@aetherexa/storage]
  ENG --> RN[@aetherexa/renderer]
  ENG --> AN[@aetherexa/animation]
  ENG --> AL[@aetherexa/asset-loader]

  PH --> SH[@aetherexa/shared]
  EB --> TY[@aetherexa/types]
  SM --> TY
  ST --> TY
  RN --> TY
  AN --> TY
  AL --> TY

  subgraph Governance
    ADR[docs/adr/*]
    RFC[rfcs/*]
    PRD[docs/prd/*]
    REV[docs/reviews/*]
  end

  Governance -. informs .-> ENG
```

## Dependency Direction

- Runtime hosts depend on packages.
- Packages must not depend on apps.
- Contracts and types are shared through explicit package exports.
- Decision artifacts (ADR/RFC/PRD) govern architecture evolution.
