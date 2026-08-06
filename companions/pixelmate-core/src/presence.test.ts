import { describe, expect, it } from "vitest";
import { resolveCompanionDisplayState } from "./presence.js";
import { DEFAULT_SETTINGS } from "./settings.js";

describe("companion presence", () => {
  it("raises excited expressions for celebrations", () => {
    const state = resolveCompanionDisplayState({
      behavior: "celebrate",
      emotion: "calm",
      expression: "neutral",
      eyes: { id: "wide", label: "Wide" },
      settings: DEFAULT_SETTINGS,
      eventType: "buildSuccess",
      idleMs: 0,
      now: 1
    });

    expect(state.expression).toBe("excited");
    expect(state.eyes.id).toBe("happy");
    expect(state.particles).toContain("sparkles");
  });

  it("switches to sleepy states during long idle", () => {
    const state = resolveCompanionDisplayState({
      behavior: "sleep",
      emotion: "calm",
      expression: "neutral",
      eyes: { id: "blink", label: "Blink" },
      settings: DEFAULT_SETTINGS,
      eventType: "idleTimeout",
      idleMs: 90_000,
      now: 1
    });

    expect(state.emotion).toBe("sleepy");
    expect(state.speech?.text).toContain("nap");
  });
});
