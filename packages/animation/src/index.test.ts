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
    expect(player.advance(400).frame).toBe("idle-1");
  });
});
