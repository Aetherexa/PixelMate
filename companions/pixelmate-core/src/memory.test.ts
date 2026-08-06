import { describe, expect, it } from "vitest";
import { CompanionMemoryStore, DEFAULT_MEMORY } from "./memory.js";

describe("memory store", () => {
  it("tracks interaction and build status", () => {
    const store = new CompanionMemoryStore(DEFAULT_MEMORY);

    store.onEvent({ type: "activity", at: 10 });
    store.onEvent({ type: "buildError", at: 12 });

    const snapshot = store.getSnapshot();
    expect(snapshot.lastInteractionAt).toBe(10);
    expect(snapshot.lastBuildStatus).toBe("error");
    expect(snapshot.lastErrorAt).toBe(12);
  });

  it("increments session length", () => {
    const store = new CompanionMemoryStore(DEFAULT_MEMORY);
    store.advanceSession(2400);
    expect(store.getSnapshot().sessionLengthMs).toBe(2400);
  });
});
