import { describe, expect, it } from "vitest";
import { chooseIntent } from "./intent.js";
import { DEFAULT_NEEDS } from "./needs.js";
import { getPersonalityProfile } from "./personality.js";

describe("intent engine", () => {
  it("prefers hide in focus mode", () => {
    const intent = chooseIntent(
      {
        needs: DEFAULT_NEEDS,
        lastEventType: null,
        isFocused: true,
        hasErrors: false,
        idleMs: 0,
        focusMode: true
      },
      getPersonalityProfile("focused")
    );

    expect(intent).toBe("hide");
  });

  it("switches to watch on errors", () => {
    const intent = chooseIntent(
      {
        needs: DEFAULT_NEEDS,
        lastEventType: "diagnosticError",
        isFocused: true,
        hasErrors: true,
        idleMs: 0,
        focusMode: false
      },
      getPersonalityProfile("calm")
    );

    expect(intent).toBe("watch");
  });
});
