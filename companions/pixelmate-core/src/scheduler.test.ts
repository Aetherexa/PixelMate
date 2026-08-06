import { describe, expect, it } from "vitest";
import { CompanionScheduler } from "./scheduler.js";
import { DEFAULT_NEEDS } from "./needs.js";

describe("scheduler", () => {
  it("runs deterministic pipeline in order", () => {
    const scheduler = new CompanionScheduler();
    const result = scheduler.tick(
      {
        deltaMs: 100,
        current: {
          needs: DEFAULT_NEEDS,
          intent: "observe",
          behavior: "idle"
        }
      },
      (_deltaMs, currentNeeds) => ({ ...currentNeeds, focus: currentNeeds.focus + 1 }),
      () => "think",
      () => "observe"
    );

    expect(result.intent).toBe("think");
    expect(result.behavior).toBe("observe");
    expect(result.needs.focus).toBe(DEFAULT_NEEDS.focus + 1);
  });
});
