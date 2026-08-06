export const PACKAGE_METADATA = {
  name: "@aetherexa/animation",
  version: "0.1.0"
};
export class AnimationPlayer {
  clip;
  frameIndex = 0;
  elapsedMs = 0;
  loopCount = 0;
  constructor(clip) {
    this.clip = clip;
  }
  advance(deltaMs) {
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
export function createAnimationClip(clip) {
  return clip;
}
//# sourceMappingURL=index.js.map
