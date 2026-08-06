# Customization Guide

The reference companion supports live customization via VS Code settings.

## Settings

- `pixelmate.companion.scale`
- `pixelmate.companion.speed`
- `pixelmate.companion.positionX`
- `pixelmate.companion.positionY`
- `pixelmate.companion.theme`
- `pixelmate.companion.animationFrequency`
- `pixelmate.companion.idleBehavior`
- `pixelmate.companion.accessibilityMode`
- `pixelmate.companion.focusMode`
- `pixelmate.companion.reduceMotion`

## Live Apply

Changes are observed through `workspace.onDidChangeConfiguration` and applied immediately to the companion kernel using `updateSettings`.

## Accessibility Recommendations

- Enable `reduceMotion` for motion-sensitive environments
- Enable `focusMode` to minimize activity during active editing
- Use lower `animationFrequency` to reduce visual intensity
