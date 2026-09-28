# PixelMate

**Your lightweight coding companion for Visual Studio Code.**

PixelMate brings a small, expressive companion into VS Code. It reacts to your work, celebrates progress, sleeps when you are idle, and stays out of the way when you are focused.

## Built-in companions

- 🙂 Smiley
- 🐱 Cat
- 🐶 Dog
- 🐴 Horse

Choose one with **PixelMate: Choose Companion** or through VS Code settings.

## What PixelMate does

PixelMate reacts to editor activity, diagnostics, task results, focus changes and inactivity. It can idle, blink, walk, wave, think, celebrate, hop, sleep and wake. Friendly speech bubbles are intentionally infrequent and can be disabled.

Normal mode is clean: internal state, frame IDs and debug panels are hidden. Design Mode exposes diagnostics for contributors. Demo Mode showcases reactions. Screenshot Mode removes overlays for clean captures.

## Quick start

Requirements: Node.js 20+, pnpm 9+, VS Code 1.94+.

```bash
pnpm install
pnpm build
pnpm test
pnpm extension:package
```

Install the generated VSIX in VS Code, then run:

- **PixelMate: Show Reference Companion**
- **PixelMate: Choose Companion**

For extension development, open the repository in VS Code and launch the Extension Development Host.

## Settings

PixelMate supports companion type, scale, animation speed, movement speed, theme, personality, behavior intensity, reduced motion, speech, auto-sleep, focus mode and debug mode.

## Architecture

PixelMate is a pnpm monorepo.

- `apps/runtime-vscode` — VS Code host and webview
- `companions/pixelmate-core` — companion brain, state, needs and behavior
- `packages/animation` — animation playback
- `packages/asset-loader` — asset manifests and loading
- `packages/renderer` — render-frame composition

The runtime observes VS Code events, feeds them to the kernel, advances companion state and sends render snapshots to the webview. The architecture remains asset-ready so richer sprite packs can replace the lightweight built-in presentation later.

See `docs/ARCHITECTURE.md`, `docs/RUNTIME.md`, `docs/RENDERER.md`, and `docs/COMPANION_DESIGN_BIBLE.md`.

## Product principles

PixelMate should make a developer smile without becoming a distraction. It is offline-first, does not require an AI service, and keeps normal-mode UI intentionally minimal.

## Contributing

Read `CONTRIBUTING.md` and `docs/TESTING.md`. Conventional Commits are required.

## Security

See `SECURITY.md`.

## License

MIT © 2026 Aetherexa.
