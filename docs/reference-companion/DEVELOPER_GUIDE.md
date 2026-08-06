# Developer Guide

## Build

```bash
pnpm build
```

## Test

```bash
pnpm test
```

## Run Companion In VS Code

1. Open repository in VS Code
2. Start `Run PixelMate Runtime`
3. Run command: `PixelMate: Show Reference Companion`

## Add New Companion Package

1. Copy `companions/pixelmate-core` to a new package directory
2. Rename package and manifest identity
3. Replace placeholder sprite manifest and themes
4. Add behavior plugins for companion-specific personality
5. Keep kernel and adapter contract surface compatible

## Validation Checklist

- Behavior transitions react to focus/build/error/idle events
- Live settings apply without restart
- Animation respects reduce-motion
- Tick loop remains non-blocking
- Unit and integration tests pass
