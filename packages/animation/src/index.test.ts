import { describe, expect, it } from "vitest";
import { AnimationPlayer, createAnimationClip, PACKAGE_METADATA } from "./index.js";

describe("animation package", () => {
  it("exports metadata", () => {
    expect(PACKAGE_METADATA.name).toBe("@aetherexa/animation");
    expect(PACKAGE_METADATA.version).toBe("0.1.0");
  });

  it("advances clips over time and loops", () => {
    const clip = createAnimationClip({
      id: "idle",
      name: "idle",
      frames: ["idle-1", "idle-2", "idle-3"],
      fps: 6,
      loop: true
    });
    const player = new AnimationPlayer(clip);

    expect(player.advance(120).frame).toBe("idle-1");
    expect(player.advance(180).frame).toBe("idle-2");
    const looped = player.advance(400);
    expect(looped.frame).toBe("idle-1");
    expect(looped.loopCount).toBe(1);
  });

  it("handles empty clips safely", () => {
    const player = new AnimationPlayer(
      createAnimationClip({ id: "empty", name: "empty", frames: [], fps: 10, loop: true })
    );

    expect(player.advance(500)).toEqual({
      frame: "",
      frameIndex: 0,
      elapsedMs: 0,
      loopCount: 0
    });
  });

  it("does not advance when delta is shorter than a frame", () => {
    const player = new AnimationPlayer(
      createAnimationClip({
        id: "blink",
        name: "blink",
        frames: ["a", "b"],
        fps: 5,
        loop: true
      })
    );

    const state = player.advance(50);
    expect(state.frame).toBe("a");
    expect(state.frameIndex).toBe(0);
    expect(state.loopCount).toBe(0);
  });
});
