# Asset Pipeline

PixelMate's asset loader owns companion manifests and animation frame metadata.

## v1
The built-in Smiley, Cat, Dog and Horse companions require no downloaded assets. Existing asset-loader contracts remain in place for future sprite packs.

## Future asset convention
`assets/sprites/<companion>/<behavior>/frame_XX.png`

Guidelines:
- transparent PNG/WebP
- local-only assets
- predictable names
- no hardcoded frame counts
- fallback presentation when an asset is unavailable
- no runtime network requirement

Asset failures must never crash the companion runtime.
