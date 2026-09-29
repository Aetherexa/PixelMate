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


## SonarQube / SonarQube Cloud

CI can run SonarQube analysis after coverage generation. Configure the repository with:

- secret: `SONAR_TOKEN`
- variable: `SONAR_PROJECT_KEY`
- variable: `SONAR_ORGANIZATION`

When configured, the scan waits for the Sonar quality gate and fails CI if the gate fails. Pull requests from forks can still run the normal repository checks; Sonar is skipped when credentials are unavailable.

Analysis settings live in `sonar-project.properties`. LCOV reports from the runtime, core companion, animation, asset-loader and renderer packages are supplied to Sonar.
