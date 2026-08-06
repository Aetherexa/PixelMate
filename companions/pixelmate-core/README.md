# PixelMate Core Companion

Canonical reference implementation of the PixelMate Companion API.

This package is runtime-agnostic and contains no VS Code-specific logic.

## Capabilities

- Companion kernel lifecycle
- Animation controller with placeholder sprite frames
- Behavior selection and event reactions
- Settings and live updates
- Persistence abstraction
- Plugin hooks and loading
- Localization and themes metadata
- Sound and particle hook placeholders

## Usage

Import from `@aetherexa/pixelmate-core` and provide a runtime adapter for rendering and host events.
