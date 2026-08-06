import { describe, expect, it } from "vitest";
import { PixelMateCompanionKernel } from "./kernel.js";

describe("kernel integration", () => {
  it("reacts to focus, build success, and errors", () => {
    const kernel = new PixelMateCompanionKernel();
    kernel.start();

    kernel.handleEvent({ type: "editorFocus", at: Date.now() });
    let snapshot = kernel.tick(80);
    expect(snapshot.behavior.length).toBeGreaterThan(0);

    kernel.handleEvent({ type: "buildSuccess", at: Date.now() });
    snapshot = kernel.tick(80);
    expect(snapshot.behavior).toBe("celebrate");

    kernel.handleEvent({ type: "diagnosticError", at: Date.now() });
    snapshot = kernel.tick(80);
    expect(["think", "observe"]).toContain(snapshot.behavior);
  });

  it("applies settings live", () => {
    const kernel = new PixelMateCompanionKernel();
    kernel.start();

    kernel.updateSettings({ reduceMotion: true, animationFrequency: 0.5, theme: "ocean" });
    const snapshot = kernel.tick(300);

    expect(snapshot.theme).toBe("ocean");
    expect(snapshot.frame.length).toBeGreaterThan(0);
  });
});
