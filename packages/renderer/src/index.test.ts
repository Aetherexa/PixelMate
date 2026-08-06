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
    expect(frame.background).toContain("#4fd1c5");
  });
});
