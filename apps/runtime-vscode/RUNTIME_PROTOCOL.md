# PixelMate Runtime Protocol

## Overview

The PixelMate runtime protocol is a versioned message contract for commands, events, acknowledgements, and responses between VS Code, the runtime host, the webview bridge, and the companion engine.

## Message Envelope

Each message contains:

- type
- payload
- timestamp
- source
- target
- version

## Core Message Types

- SHOW_COMPANION
- HIDE_COMPANION
- SET_MODE
- PLAY_ANIMATION
- SET_THEME
- SET_PERSONALITY
- MOVE
- SPEAK
- SLEEP
- WAKE
- IDLE
- OBSERVE
- FOLLOW_CURSOR
- FREEZE
- RESUME
- ENABLE_DEBUG
- DISABLE_DEBUG
- EXPORT_FRAME
- CAPTURE_SCREENSHOT
- LOAD_COMPANION
- CHANGE_SKIN
- PLAY_EFFECT
- UNLOCK_ACHIEVEMENT
- SHOW_DIALOG
- PING
- ACK
- ERROR
- EVENT
- REQUEST
- RESPONSE

## Versioning

All messages are versioned with the current protocol version. The runtime currently targets protocol version 1.
