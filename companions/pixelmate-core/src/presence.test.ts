import { describe, expect, it } from "vitest";
import { resolveCompanionDisplayState } from "./presence.js";
import { DEFAULT_SETTINGS } from "./settings.js";

const baseInput = {
  emotion: "calm" as const,
  expression: "neutral" as const,
  eyes: { id: "wide", label: "Wide" },
  settings: DEFAULT_SETTINGS,
  eventType: null,
  idleMs: 0,
  now: 1
};

describe("companion presence", () => {
  it("raises excited expressions for celebrations", () => {
    const state = resolveCompanionDisplayState({
      ...baseInput,
      behavior: "celebrate",
      eventType: "buildSuccess"
    });

    expect(state.expression).toBe("excited");
    expect(state.eyes.id).toBe("happy");
    expect(state.particles).toContain("sparkles");
    expect(state.speech?.tone).toBe("playful");
  });

  it("switches to sleepy states during long idle", () => {
    const state = resolveCompanionDisplayState({
      ...baseInput,
      behavior: "idle",
      idleMs: 90_000
    });

    expect(state.emotion).toBe("sleepy");
    expect(state.speech?.text).toContain("nap");
  });

  it("greets on wave or editor focus", () => {
    const state = resolveCompanionDisplayState({
      ...baseInput,
      behavior: "idle",
      eventType: "editorFocus"
    });

    expect(state.expression).toBe("happy");
    expect(state.emotion).toBe("curious");
    expect(state.speech?.text).toBe("Hello!");
  });

  it("shows a thinking state for diagnostics", () => {
    const state = resolveCompanionDisplayState({
      ...baseInput,
      behavior: "idle",
      eventType: "diagnosticError"
    });

    expect(state.expression).toBe("thinking");
    expect(state.eyes.id).toBe("thinking");
  });

  it("uses curious eyes while walking", () => {
    const state = resolveCompanionDisplayState({
      ...baseInput,
      behavior: "walk"
    });

    expect(state.expression).toBe("curious");
    expect(state.eyes.id).toBe("left");
    expect(state.speech).toBeNull();
  });

  it("suppresses speech for reduced motion and accessibility", () => {
    const reduced = resolveCompanionDisplayState({
      ...baseInput,
      behavior: "wave",
      settings: { ...DEFAULT_SETTINGS, reduceMotion: true }
    });
    const accessible = resolveCompanionDisplayState({
      ...baseInput,
      behavior: "wave",
      settings: { ...DEFAULT_SETTINGS, accessibilityMode: true }
    });

    expect(reduced.speech).toBeNull();
    expect(reduced.allowSpeech).toBe(false);
    expect(accessible.speech).toBeNull();
    expect(accessible.allowSpeech).toBe(false);
  });

  it("disables allowSpeech when time is not positive", () => {
    const state = resolveCompanionDisplayState({
      ...baseInput,
      behavior: "idle",
      now: 0
    });

    expect(state.allowSpeech).toBe(false);
  });
});
