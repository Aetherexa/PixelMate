export interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}

export const PACKAGE_METADATA: PackageMetadata = {
  name: "@aetherexa/asset-loader",
  version: "0.1.0"
};

export interface AssetSprite {
  readonly id: string;
  readonly frames: string[];
  readonly defaultFrame?: string;
}

export interface AssetAnimation {
  readonly id: string;
  readonly fps: number;
  readonly loop: boolean;
  readonly frames: string[];
}

export interface CompanionAssetManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly sprites: Record<string, AssetSprite>;
  readonly animations: Record<string, AssetAnimation>;
}

export interface LoadedAssetBundle {
  readonly manifest: CompanionAssetManifest;
  readonly sprites: Map<string, AssetSprite>;
  readonly animations: Map<string, AssetAnimation>;
}

export class AssetLoader {
  private readonly sprites = new Map<string, AssetSprite>();
  private readonly animations = new Map<string, AssetAnimation>();
  private manifest: CompanionAssetManifest | undefined;

  public loadManifest(manifest: CompanionAssetManifest): CompanionAssetManifest {
    this.manifest = manifest;

    for (const [id, sprite] of Object.entries(manifest.sprites)) {
      this.sprites.set(id, sprite);
    }

    for (const [id, animation] of Object.entries(manifest.animations)) {
      this.animations.set(id, animation);
    }

    return manifest;
  }

  public getSprite(id: string): AssetSprite | undefined {
    return this.sprites.get(id);
  }

  public getAnimation(id: string): AssetAnimation | undefined {
    return this.animations.get(id);
  }

  public getManifest(): CompanionAssetManifest | undefined {
    return this.manifest;
  }

  public getBundle(): LoadedAssetBundle | undefined {
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

export function createCompanionAssetManifest(): CompanionAssetManifest {
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
