export const PACKAGE_METADATA = {
  name: "@aetherexa/asset-loader",
  version: "0.1.0"
};
export class AssetLoader {
  sprites = new Map();
  animations = new Map();
  manifest;
  loadManifest(manifest) {
    this.manifest = manifest;
    for (const [id, sprite] of Object.entries(manifest.sprites)) {
      this.sprites.set(id, sprite);
    }
    for (const [id, animation] of Object.entries(manifest.animations)) {
      this.animations.set(id, animation);
    }
    return manifest;
  }
  getSprite(id) {
    return this.sprites.get(id);
  }
  getAnimation(id) {
    return this.animations.get(id);
  }
  getManifest() {
    return this.manifest;
  }
  getBundle() {
    if (this.manifest === undefined) {
      return undefined;
    }
    return {
      manifest: this.manifest,
      sprites: this.sprites,
      animations: this.animations
    };
  }
}
export function createCompanionAssetManifest() {
  return {
    id: "pixelmate-reference-companion",
    name: "PixelMate Reference Companion",
    version: "1.0.0",
    sprites: {
      idle: {
        id: "idle",
        frames: ["idle-1", "idle-2", "idle-3"],
        defaultFrame: "idle-1"
      }
    },
    animations: {
      walk: {
        id: "walk",
        fps: 10,
        loop: true,
        frames: ["walk-1", "walk-2", "walk-3"]
      }
    }
  };
}
//# sourceMappingURL=index.js.map
