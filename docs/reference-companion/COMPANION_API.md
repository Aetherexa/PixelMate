# Companion API

## Kernel

`PixelMateCompanionKernel`

Primary responsibilities:

- `start()` and `stop()` lifecycle transitions
- `tick(deltaMs)` animation/behavior progression
- `handleEvent(event)` event processing
- `updateSettings(partial)` live customization updates
- `registerBehaviorPlugin(plugin)` plugin loading and behavior extension
- `loadAssets()` sprite manifest loading

## Events

Supported event types:

- `editorFocus`
- `editorBlur`
- `buildSuccess`
- `buildError`
- `diagnosticError`
- `diagnosticClear`
- `idleTimeout`
- `activity`

## Behaviors

Supported behavior states:

- `idle`
- `walk`
- `blink`
- `wave`
- `sleep`
- `celebrate`
- `lookAround`

## Settings Model

- `scale`
- `speed`
- `position.x`
- `position.y`
- `theme`
- `animationFrequency`
- `idleBehavior`
- `accessibilityMode`
- `focusMode`
- `reduceMotion`

## Extensibility

`CompanionBehaviorPlugin`

- `onEvent(eventType, context)`
- `onTick(context)`

Plugins can override behavior decisions without mutating kernel internals.
