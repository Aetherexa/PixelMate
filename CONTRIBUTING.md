# Contributing to PixelMate

## Prerequisites
- Node.js 20+
- pnpm 9+
- VS Code (recommended)

## Setup
```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

## Branch Strategy
- main: protected, releasable
- feature/*: focused changes
- fix/*: defect fixes
- chore/*: maintenance and tooling

## Commit Convention
Conventional commits are required.
Examples:
- feat(runtime-vscode): add command registration
- fix(engine): correct package export map
- chore(ci): tighten lint workflow caching

## Pull Request Requirements
- Clear summary and motivation
- Linked issue when applicable
- Tests added or updated
- Documentation updated if behavior or architecture changes
- Lint, typecheck, build, and tests passing

## Review Checklist
- Architectural boundaries preserved
- No hidden coupling introduced
- Public API implications considered
- Error handling and logging quality maintained
- Security and privacy considerations addressed
