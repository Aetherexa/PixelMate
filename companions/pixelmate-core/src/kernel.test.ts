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
});
