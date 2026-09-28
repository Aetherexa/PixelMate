# Animation Engine

PixelMate animations are driven by behavior/state, not by UI-specific code.

## Core states
Idle, walk, blink, wave, celebrate, hop, think, observe, stretch, sleep and wake.

## Rules
- State changes originate in the kernel/behavior layer.
- Rendering maps the active behavior to a visual treatment.
- Reduced motion disables non-essential movement.
- Demo mode cycles expressive states.
- Sleep is entered after inactivity when auto-sleep is enabled.

Animation code must remain deterministic enough to test and lightweight enough for continuous editor use.
