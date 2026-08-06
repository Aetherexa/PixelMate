export interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}

export const PACKAGE_METADATA: PackageMetadata = {
  name: "@aetherexa/animation",
  version: "0.1.0"
};

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

export class AnimationPlayer {
  private frameIndex = 0;
  private elapsedMs = 0;
  private loopCount = 0;

  public constructor(private readonly clip: AnimationClip) {}

  public advance(deltaMs: number): AnimationPlaybackState {
    if (this.clip.frames.length === 0) {
      return { frame: "", frameIndex: 0, elapsedMs: 0, loopCount: 0 };
    }

    const frameDurationMs = 1000 / this.clip.fps;
    const stepCount = Math.floor(deltaMs / frameDurationMs);
    if (stepCount > 0) {
      this.frameIndex = (this.frameIndex + stepCount) % this.clip.frames.length;
      if (this.frameIndex === 0 && stepCount > 0) {
        this.loopCount += 1;
      }
    }

    this.elapsedMs = deltaMs % frameDurationMs;

    return {
      frame: this.clip.frames[this.frameIndex] ?? this.clip.frames[0] ?? "",
      frameIndex: this.frameIndex,
      elapsedMs: this.elapsedMs,
      loopCount: this.loopCount
    };
  }
}

export function createAnimationClip(clip: AnimationClip): AnimationClip {
  return clip;
}
