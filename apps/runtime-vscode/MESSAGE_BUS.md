# Runtime Message Bus

## Purpose

The runtime message bus provides a production-ready publish-subscribe mechanism for commands, events, acknowledgements, and bridge traffic within the PixelMate runtime.

## Features

- publish
- subscribe
- unsubscribe
- once
- broadcast
- middleware support
- lightweight tracing helpers

## Usage

The host owns the bus instance and routes every runtime command through it before the companion engine reacts to the event.
