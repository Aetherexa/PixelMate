# Runtime

PixelMate's VS Code runtime lives in `apps/runtime-vscode`.

## Responsibilities
- Activate/deactivate the extension.
- Own the companion webview lifecycle.
- Translate VS Code events into companion events.
- Apply user configuration.
- Route runtime messages and render snapshots.

## Lifecycle
1. Extension activates.
2. `RuntimeCompanionHost` loads assets and starts the kernel.
3. Workspace/editor/task/diagnostic events update companion state.
4. The host ticks the kernel and posts render snapshots to the webview.
5. Disposal stops timers, closes the panel, persists memory and disposes the kernel.

## Commands
- PixelMate: Show Reference Companion
- PixelMate: Choose Companion
- PixelMate: Demo Mode
- PixelMate: Design Mode
- PixelMate: Screenshot Mode
- PixelMate: Alive Check

The runtime must remain thin: VS Code-specific concerns belong here; reusable companion logic belongs in packages or `pixelmate-core`.
