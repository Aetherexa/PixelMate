import type { CompanionBehavior, SpriteAssetManifest } from "./model.js";

const FRAME_BASE_MS = 220;

export class SpriteManager {
  private sprites: Readonly<Record<CompanionBehavior, ReadonlyArray<string>>>;

  public constructor(manifest: SpriteAssetManifest) {
    this.sprites = manifest.behaviors;
  }

  public load(manifest: SpriteAssetManifest): void {
    this.sprites = manifest.behaviors;
  }

  public getFrames(behavior: CompanionBehavior): ReadonlyArray<string> {
    return this.sprites[behavior];
  }
}

export class AnimationController {
  private frameIndex = 0;
  private frameElapsedMs = 0;
  private activeBehavior: CompanionBehavior = "idle";

  public setBehavior(behavior: CompanionBehavior): void {
    if (behavior === this.activeBehavior) {
      return;
    }
    this.activeBehavior = behavior;
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
  }

  public advance(params: {
    readonly deltaMs: number;
    readonly frames: ReadonlyArray<string>;
    readonly speed: number;
    readonly animationFrequency: number;
    readonly reduceMotion: boolean;
  }): string {
    const { deltaMs, frames, speed, animationFrequency, reduceMotion } = params;

    if (frames.length === 0) {
      return "missing-frame";
    }

    if (reduceMotion) {
      return frames[0] ?? "missing-frame";
    }

    const rateModifier = Math.max(0.2, speed * animationFrequency);
    const frameDurationMs = FRAME_BASE_MS / rateModifier;

    this.frameElapsedMs += deltaMs;
    while (this.frameElapsedMs >= frameDurationMs) {
      this.frameElapsedMs -= frameDurationMs;
      this.frameIndex = (this.frameIndex + 1) % frames.length;
    }

    return frames[this.frameIndex] ?? frames[0] ?? "missing-frame";
  }
}
