import { describe, expect, it } from "vitest";
import { decideBehavior } from "./behaviors.js";
import { DEFAULT_NEEDS } from "./needs.js";
import { getPersonalityProfile } from "./personality.js";
import { DEFAULT_SETTINGS } from "./settings.js";

describe("behavior decisions", () => {
  it("celebrates after build success", () => {
    const result = decideBehavior({
      settings: DEFAULT_SETTINGS,
      intent: "celebrate",
      needs: DEFAULT_NEEDS,
      personality: getPersonalityProfile("cheerful"),
      idleMs: 0,
      editorFocused: true,
      hasErrors: false,
      lastEventType: "buildSuccess",
      randomSeed: 2,
      now: 1,
      lastBehavior: "idle",
      cooldowns: {}
    });

    expect(result).toBe("celebrate");
  });

  it("looks around when diagnostics show errors", () => {
    const result = decideBehavior({
      settings: DEFAULT_SETTINGS,
      intent: "watch",
      needs: DEFAULT_NEEDS,
      personality: getPersonalityProfile("focused"),
      idleMs: 0,
      editorFocused: true,
      hasErrors: true,
      lastEventType: "diagnosticError",
      randomSeed: 4,
      now: 1,
      lastBehavior: "idle",
      cooldowns: {}
    });

    expect(["think", "observe"]).toContain(result);
  });
});
