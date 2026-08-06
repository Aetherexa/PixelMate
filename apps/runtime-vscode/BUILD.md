# PixelMate Runtime Build Guide

## Architecture

The VS Code runtime is packaged as a bundled extension entry point. The extension source lives in src and is compiled by esbuild into a single Node-targeted bundle at dist/extension.js.

## Bundling strategy

- The runtime entry point is the extension host in src/extension.ts.
- Internal companion packages are bundled into the extension output.
- Only vscode remains external at runtime.
- This avoids workspace:* dependency resolution problems during VSCE packaging.

## Development workflow

- pnpm --filter pixelmate-runtime-vscode build
- pnpm --filter pixelmate-runtime-vscode dev
- pnpm --filter pixelmate-runtime-vscode test

## Production workflow

- pnpm --filter pixelmate-runtime-vscode build:prod
- pnpm --filter pixelmate-runtime-vscode package:vsix

## Publishing

1. Build and test the extension.
2. Package the VSIX.
3. Publish with vsce.

## Why this pipeline is production-ready

Bundling makes the extension portable, removes runtime dependency on workspace packages, and ensures the packaged VSIX contains everything required for activation.
