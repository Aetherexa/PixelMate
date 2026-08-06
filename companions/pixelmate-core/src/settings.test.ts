import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, mergeSettings } from "./settings.js";

describe("settings", () => {
  it("merges nested position", () => {
    const next = mergeSettings(DEFAULT_SETTINGS, { position: { x: 0.2, y: 0.5 } });

    expect(next.position.x).toBe(0.2);
    expect(next.position.y).toBe(0.5);
  });
});
