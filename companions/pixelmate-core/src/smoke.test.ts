import { describe, expect, it } from "vitest";
import { PIXELMATE_CORE_MANIFEST, PixelMateCompanionKernel } from "./index.js";

describe("reference companion smoke", () => {
  it("exports canonical manifest", () => {
    expect(PIXELMATE_CORE_MANIFEST.name).toBe("PixelMate Core");
    expect(PIXELMATE_CORE_MANIFEST.supportedBehaviors).toContain("sleep");
  });

  it("supports plugin behavior override", () => {
    const kernel = new PixelMateCompanionKernel();
    kernel.registerBehaviorPlugin({
      id: "always-wave",
      onTick: () => "wave"
    });

    kernel.start();
    const snapshot = kernel.tick(16);

    expect(snapshot.behavior).toBe("wave");
  });
});
