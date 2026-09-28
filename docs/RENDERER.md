# Renderer

The renderer converts companion state into presentation data consumed by the VS Code webview.

## v1 presentation
PixelMate ships with four lightweight built-in companions: Smiley, Cat, Dog and Horse. The runtime presents them without external network assets.

Production mode never displays frame IDs or placeholder labels. Debug information is shown only when debug/design mode is enabled.

## Principles
- Preserve the existing renderer boundary.
- Prefer transforms over layout-heavy DOM changes.
- Respect reduced-motion settings.
- Keep the companion inside the stage.
- Never block editor interaction.
- Pause work when the panel is unavailable.

Future sprite packs may replace the built-in glyph presentation without changing kernel behavior contracts.
