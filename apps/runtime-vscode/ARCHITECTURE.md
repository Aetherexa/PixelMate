# PixelMate Runtime Architecture

## Components

- VS Code extension entrypoint
- Runtime host
- Runtime message bus
- Webview bridge
- Companion engine
- Renderer and animation layer

## Runtime Flow

1. VS Code commands publish runtime messages.
2. The host routes messages through the message bus.
3. The host updates the companion engine and webview state.
4. The renderer updates the UI and debug console.

## Design Goals

- Reliable command handling
- Clear message flow
- Immediate user feedback
- Marketplace-ready packaging
