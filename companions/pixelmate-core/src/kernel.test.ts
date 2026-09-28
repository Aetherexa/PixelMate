import { describe, expect, it } from "vitest";
import { PixelMateCompanionKernel } from "./kernel.js";

describe("PixelMateCompanionKernel lifecycle", () => {
  it("starts, ticks and returns snapshots", () => {
    const kernel = new PixelMateCompanionKernel();
    kernel.start();

    const snapshot = kernel.tick(120);

    expect(snapshot.lifecycle).toBe("running");
    expect(snapshot.frame.length).toBeGreaterThan(0);
    expect(snapshot.metrics.ticks).toBe(1);
  });

  it("sleeps on idle timeout", () => {
    const kernel = new PixelMateCompanionKernel();
    kernel.start();
    kernel.handleEvent({ type: "idleTimeout", at: Date.now() });

    const snapshot = kernel.tick(16);

    expect(snapshot.lifecycle).toBe("sleeping");
    expect(snapshot.behavior).toBe("sleep");
  });

  it("exposes manifest themes settings and locale controls", () => {
    const kernel = new PixelMateCompanionKernel();

    expect(kernel.getManifest().id).toBe("pixelmate-core");
    expect(kernel.getThemes().length).toBeGreaterThan(0);
    expect(kernel.getSettings().companionType).toBe("smiley");

    kernel.updateSettings({ companionType: "cat", speechEnabled: false });
    expect(kernel.getSettings().companionType).toBe("cat");
    expect(kernel.getSettings().speechEnabled).toBe(false);

    kernel.setLocale("en-GB");
    kernel.start();
    expect(kernel.tick(0).locale).toBe("en-GB");
  });

  it("supports asset loading plugins stop and dispose lifecycle paths", () => {
    const kernel = new PixelMateCompanionKernel();
    kernel.loadAssets();
    kernel.registerBehaviorPlugin({
      id: "test-wave",
      onEvent: (eventType) => (eventType === "editorFocus" ? "wave" : undefined)
    });

    kernel.start();
    kernel.handleEvent({ type: "editorFocus", at: 1 });
    expect(kernel.tick(16).behavior).toBe("wave");

    kernel.stop();
    expect(kernel.tick(16).lifecycle).toBe("stopped");

    kernel.dispose();
    expect(kernel.tick(16).lifecycle).toBe("disposed");
  });
});
