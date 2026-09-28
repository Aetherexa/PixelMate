import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, mergeSettings, type CompanionSettings } from "./settings.js";

describe("settings", () => {
  it("merges nested position without losing the other coordinate", () => {
    const next = mergeSettings(DEFAULT_SETTINGS, {
      position: { x: 0.2, y: DEFAULT_SETTINGS.position.y }
    });

    expect(next.position.x).toBe(0.2);
    expect(next.position.y).toBe(DEFAULT_SETTINGS.position.y);
  });

  it("merges companion presentation settings", () => {
    const next = mergeSettings(DEFAULT_SETTINGS, {
      companionType: "dog",
      speechEnabled: false,
      autoSleep: false,
      reduceMotion: true
    });

    expect(next.companionType).toBe("dog");
    expect(next.speechEnabled).toBe(false);
    expect(next.autoSleep).toBe(false);
    expect(next.reduceMotion).toBe(true);
  });

  it("does not mutate the default settings object", () => {
    const before: CompanionSettings = structuredClone(DEFAULT_SETTINGS);
    mergeSettings(DEFAULT_SETTINGS, {
      position: { x: 0.1, y: 0.2 },
      personality: "playful"
    });

    expect(DEFAULT_SETTINGS).toEqual(before);
  });
});
