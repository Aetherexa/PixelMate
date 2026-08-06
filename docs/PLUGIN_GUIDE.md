# Plugin Guide

Everything in PixelMate is a plugin, including built-in features.

## Plugin Contract

A plugin must implement:

- `id`
- `version`
- `capabilities`
- `initialize(context)`
- optional `dispose()`

## Context Access

Plugins receive typed access to subsystem contracts only, never concrete private engine internals.

## Lifecycle

1. Plugin host validates uniqueness.
2. Plugin initializes with context.
3. Engine emits `PluginLoaded`.
4. On removal, `dispose` runs and `PluginUnloaded` is emitted.

## Extension Strategy

Add new feature plugins by consuming public contracts and events. No engine rewrites are required.
