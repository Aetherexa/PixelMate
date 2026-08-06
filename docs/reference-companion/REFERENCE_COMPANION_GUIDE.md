# Reference Companion Guide

## Purpose

PixelMate Core is the official reference companion implementation for the PixelMate platform.

This package validates the complete companion contract, behavior model, animation engine, lifecycle, settings, persistence, plugin loading, and event integration.

## Package Location

- companions/pixelmate-core

## Canonical Guarantees

- Runtime-agnostic kernel
- Placeholder sprite animation pipeline
- Defined lifecycle (`stopped`, `running`, `sleeping`)
- Stable behavior state model
- Live customization settings
- Persistence abstraction
- Plugin behavior extension hooks
- Localization, themes, and optional FX hooks

## Runtime Integration

The VS Code runtime host in `apps/runtime-vscode` provides adapter responsibilities:

- Event bridge from VS Code to companion kernel
- Webview rendering for placeholder sprite display
- Settings synchronization via VS Code configuration
- Diagnostics and build event reaction wiring

## Future Companion Packs

Future companion packages should copy `companions/pixelmate-core` and replace only:

- Manifest identity and metadata
- Sprite assets
- Theme/localization payloads
- Optional behavior plugins

Core architectural boundaries and lifecycle contracts should remain intact.
