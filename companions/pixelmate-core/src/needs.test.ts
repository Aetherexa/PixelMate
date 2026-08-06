import { describe, expect, it } from "vitest";
import { applyNeedEvent, DEFAULT_NEEDS, updateNeedsByDrift } from "./needs.js";

describe("needs system", () => {
  it("applies deterministic drift", () => {
    const next = updateNeedsByDrift(DEFAULT_NEEDS, 2000);
    expect(next.energy).toBeLessThan(DEFAULT_NEEDS.energy);
    expect(next.rest).toBeGreaterThan(DEFAULT_NEEDS.rest);
  });

  it("responds to typing and build events", () => {
    const afterTyping = applyNeedEvent(DEFAULT_NEEDS, { type: "typingStarted", at: 1 });
    expect(afterTyping.focus).toBeGreaterThan(DEFAULT_NEEDS.focus);

    const afterBuild = applyNeedEvent(afterTyping, { type: "buildSuccess", at: 2 });
    expect(afterBuild.happiness).toBeGreaterThan(afterTyping.happiness);
  });
});
