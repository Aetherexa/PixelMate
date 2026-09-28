import { describe, expect, it } from "vitest";
import { PACKAGE_METADATA, buildRenderFrame } from "./index.js";

describe("renderer package", () => {
  it("exports metadata", () => {
    expect(PACKAGE_METADATA.name).toBe("@aetherexa/renderer");
    expect(PACKAGE_METADATA.version).toBe("0.1.0");
  });

  it("builds a sprite frame descriptor from state", () => {
    const frame = buildRenderFrame({
      frame: "walk-2",
      scale: 1.25,
      theme: "ocean",
      rotation: -4,
      mirrored: true
    });

    expect(frame.label).toBe("walk-2");
    expect(frame.transform).toContain("scale(1.25)");
    expect(frame.transform).toContain("rotate(-4.0deg)");
    expect(frame.transform).toContain("scaleX(-1)");
    expect(frame.background).toContain("#4fd1c5");
    expect(frame.opacity).toBe(1);
  });

  it("uses defaults and falls back to the default palette", () => {
    const frame = buildRenderFrame({
      frame: "idle-1",
      scale: 1,
      theme: "unknown"
    });

    expect(frame.transform).toBe("scale(1.00)");
    expect(frame.background).toContain("#00b4d8");
    expect(frame.background).toContain("#1b4965");
  });

  it("supports rotation without mirroring", () => {
    const frame = buildRenderFrame({
      frame: "think-1",
      scale: 0.75,
      theme: "sunrise",
      rotation: 6,
      mirrored: false
    });

    expect(frame.transform).toBe("scale(0.75) rotate(6.0deg)");
    expect(frame.background).toContain("#ff9e6d");
  });
});
