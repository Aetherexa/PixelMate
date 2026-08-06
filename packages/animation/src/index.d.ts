export interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}
export declare const PACKAGE_METADATA: PackageMetadata;
export interface AnimationClip {
  readonly id: string;
  readonly name: string;
  readonly frames: string[];
  readonly fps: number;
  readonly loop: boolean;
}
export interface AnimationPlaybackState {
  readonly frame: string;
  readonly frameIndex: number;
  readonly elapsedMs: number;
  readonly loopCount: number;
}
export declare class AnimationPlayer {
  private readonly clip;
  private frameIndex;
  private elapsedMs;
  private loopCount;
  constructor(clip: AnimationClip);
  advance(deltaMs: number): AnimationPlaybackState;
}
export declare function createAnimationClip(clip: AnimationClip): AnimationClip;
//# sourceMappingURL=index.d.ts.map
