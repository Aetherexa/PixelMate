# Engine Guide

## Engine API

- `createPixelMateEngine(options)`
- `registerPlugin(plugin)`
- `unregisterPlugin(pluginId)`
- `start()`
- `stop()`

## Built-in Modules

- Core orchestration
- Plugin host
- Typed event bus
- Renderer abstraction
- Animation, asset, theme, and state machine engines
- Settings, storage, statistics, missions, achievements, dialogue
- Lifecycle, diagnostics, developer tools, accessibility

## Performance Goals

- Lazy initialization by default
- Dirty-scene skip in renderer abstraction
- Memory-efficient in-memory adapters

## Runtime Separation

The runtime host package initializes environment bindings and delegates behavior to the engine.
