export interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}
export declare const PACKAGE_METADATA: PackageMetadata;
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
export declare class AssetLoader {
  private readonly sprites;
  private readonly animations;
  private manifest;
  loadManifest(manifest: CompanionAssetManifest): CompanionAssetManifest;
  getSprite(id: string): AssetSprite | undefined;
  getAnimation(id: string): AssetAnimation | undefined;
  getManifest(): CompanionAssetManifest | undefined;
  getBundle(): LoadedAssetBundle | undefined;
}
export declare function createCompanionAssetManifest(): CompanionAssetManifest;
//# sourceMappingURL=index.d.ts.map
