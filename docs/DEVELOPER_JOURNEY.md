# Developer Journey

## 1. Discover

- Read README.md for mission, architecture, and roadmap.
- Review docs/README.md and docs/ARCHITECTURE_DIAGRAM.md.

## 2. Setup

- Install Node.js 20+ and pnpm 9+.
- Run `pnpm install`.
- Run `pnpm build`.

## 3. Validate

- Run `pnpm lint`.
- Run `pnpm typecheck`.
- Run `pnpm test`.

## 4. Explore Runtime

- Build the VS Code host: `pnpm --filter pixelmate-runtime-vscode build`.
- Package VSIX: `pnpm --filter pixelmate-runtime-vscode package:vsix`.
- Launch Extension Development Host and run `PixelMate: Alive Check`.

## 5. Contribute Safely

- Use issue forms and PR template.
- Keep package boundaries intact.
- Update docs for architecture or behavior changes.

## 6. Propose Direction

- Use RFC template for major changes.
- Use ADR process for architecture decisions.
- Keep decisions and release notes traceable.

## 7. Release Readiness

- Pass lint, typecheck, build, and tests.
- Confirm changelog and release notes are updated.
- Validate security and compliance requirements.
