# PixelMate v1.0.0 Release Notes

Release Date: 2026-09-28  
Release Type: Stable Marketplace Release

## Overview

PixelMate v1.0.0 turns the runtime foundation into a complete, lightweight coding companion for Visual Studio Code.

The release focuses on a polished first-run experience, simple built-in companions, responsive behaviors, accessibility, packaging reliability, public-repository quality gates, and production release automation.

## Highlights

- Four built-in companions: Smiley, Cat, Dog, and Horse
- Companion picker from the Command Palette
- Idle, blink, walk, wave, think, celebrate, hop, sleep, and wake reactions
- Reactions to typing, focus, diagnostics, task results, and inactivity
- Friendly low-frequency speech bubbles
- Auto-sleep, reduced-motion, focus, theme, personality, and debug settings
- Demo, Design, and Screenshot runtime modes
- Clean production presentation with debug labels hidden by default
- Offline-first runtime with no AI or network dependency required

## Engineering and Quality

- Runtime protocol and message bus tests
- Extension command and companion-selection tests
- Core behavior, memory, presence, settings, animation, renderer, and asset-loader tests
- Package-level coverage thresholds
- Lint, typecheck, build, test, CodeQL, Commitlint, and Dependabot workflows
- Frozen-lockfile CI installs
- VSIX packaging as a CI artifact
- Release automation for GitHub Releases and the VS Code Marketplace

## Release Validation

A release is eligible only after:

1. Lint passes.
2. Typecheck passes.
3. Coverage gates pass.
4. Build passes.
5. VSIX packaging succeeds.
6. The generated VSIX is smoke-tested in a clean VS Code profile.

The VS Code host/webview integration is validated by build/package smoke testing; reusable runtime modules remain under strict unit coverage thresholds.

## Compatibility

- Visual Studio Code 1.94.0 or newer
- Node.js 20.11+ for contributors
- pnpm 9.15.0 for repository development

## Privacy

PixelMate is local and offline-first. No telemetry or external AI service is required for the v1 companion experience.

## Known Scope

PixelMate v1 intentionally does not include a public companion SDK, Studio, community marketplace, cloud features, voice, or generated sprite packs. Those remain future directions rather than v1 dependencies.
