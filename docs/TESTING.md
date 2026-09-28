# Testing Strategy

Before release, run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm extension:package
```

## Required coverage areas
- kernel state transitions
- settings merge/defaults
- command registration
- runtime protocol/message bus
- companion selection
- reduced motion and auto-sleep behavior
- renderer fallback behavior
- VSIX packaging

## Manual smoke test
Install the generated VSIX in a clean VS Code profile, open PixelMate, switch all four companions, trigger Demo/Design/Screenshot modes, type/edit files, run a task and verify diagnostics reactions.
