import { describe, expect, it } from "vitest";
import { AnimationController } from "./animation.js";

describe("animation controller", () => {
  it("advances frames over time", () => {
    const animation = new AnimationController();
    animation.setBehavior("walk");

    const f1 = animation.advance({
      deltaMs: 16,
      frames: ["a", "b", "c"],
      speed: 1,
      animationFrequency: 1,
      reduceMotion: false
    });

    const f2 = animation.advance({
      deltaMs: 260,
      frames: ["a", "b", "c"],
      speed: 1,
      animationFrequency: 1,
      reduceMotion: false
    });

    expect(f1).toBe("a");
    expect(f2).toBe("b");
  });

  it("pins to first frame with reduce motion", () => {
    const animation = new AnimationController();
    animation.setBehavior("walk");

    const frame = animation.advance({
      deltaMs: 999,
      frames: ["a", "b", "c"],
      speed: 2,
      animationFrequency: 2,
      reduceMotion: true
    });

    expect(frame).toBe("a");
  });
});
