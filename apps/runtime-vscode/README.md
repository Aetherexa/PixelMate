# Runtime VS Code

VS Code Runtime Host for PixelMate.

## PixelMate Runtime v1.0

PixelMate Runtime is a polished VS Code companion experience that brings a living assistant into the editor with responsive modes, a message-driven runtime, and a delightful companion UI.

## Features

- Launches a companion webview directly from VS Code
- Connects commands to the runtime message bus
- Supports Design, Demo, and Screenshot modes
- Reacts to workspace activity with animated companion behavior
- Exposes a runtime debug panel with event timeline export
- Packages cleanly for Marketplace distribution

## Marketplace Preview Screenshots

![Command Palette](assets/marketplace/screenshot-command-palette.png)

![Alive Notification](assets/marketplace/screenshot-notification.png)

## Build and release

- pnpm build
- pnpm build:prod
- pnpm test
- pnpm package:vsix

The extension is bundled with esbuild into dist/extension.js for production packaging, which keeps the VSIX self-contained and avoids workspace dependency issues during publishing.

## Documentation

- [RUNTIME_PROTOCOL.md](RUNTIME_PROTOCOL.md)
- [MESSAGE_BUS.md](MESSAGE_BUS.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)

## Repository

- Main repository: https://github.com/aetherexa/pixelmate
- Issues: https://github.com/aetherexa/pixelmate/issues
- Discussions: https://github.com/aetherexa/pixelmate/discussions
