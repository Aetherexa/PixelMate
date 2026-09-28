import { describe, expect, it } from "vitest";
import { CompanionMemoryStore, DEFAULT_MEMORY } from "./memory.js";

describe("memory store", () => {
  it("tracks interaction and error status", () => {
    const store = new CompanionMemoryStore(DEFAULT_MEMORY);

    store.onEvent({ type: "activity", at: 10 });
    store.onEvent({ type: "buildError", at: 12 });

    const snapshot = store.getSnapshot();
    expect(snapshot.lastInteractionAt).toBe(10);
    expect(snapshot.lastBuildStatus).toBe("error");
    expect(snapshot.lastErrorAt).toBe(12);
  });

  it("tracks successful builds and diagnostic errors", () => {
    const store = new CompanionMemoryStore();
    store.onEvent({ type: "buildSuccess", at: 20 });
    expect(store.getSnapshot().lastBuildStatus).toBe("success");

    store.onEvent({ type: "diagnosticError", at: 22 });
    expect(store.getSnapshot().lastBuildStatus).toBe("error");
    expect(store.getSnapshot().lastErrorAt).toBe(22);
  });

  it("tracks workspace and open-file metadata safely", () => {
    const store = new CompanionMemoryStore();
    store.onEvent({ type: "workspaceLoaded", at: 1, payload: { workspace: "PixelMate" } });
    store.onEvent({ type: "openFilesChanged", at: 2, payload: { count: 3.8 } });

    expect(store.getSnapshot().currentWorkspace).toBe("PixelMate");
    expect(store.getSnapshot().openFilesCount).toBe(3);

    store.onEvent({ type: "workspaceLoaded", at: 3, payload: { workspace: 42 } });
    store.onEvent({ type: "openFilesChanged", at: 4, payload: { count: -10 } });
    expect(store.getSnapshot().currentWorkspace).toBe("workspace");
    expect(store.getSnapshot().openFilesCount).toBe(0);

    store.onEvent({ type: "openFilesChanged", at: 5, payload: { count: "not-a-number" } });
    expect(store.getSnapshot().openFilesCount).toBe(0);
  });

  it("increments session length without going negative", () => {
    const store = new CompanionMemoryStore(DEFAULT_MEMORY);
    store.advanceSession(2400);
    store.advanceSession(-5000);
    expect(store.getSnapshot().sessionLengthMs).toBe(2400);
  });

  it("records celebration walk and sleep timestamps", () => {
    const store = new CompanionMemoryStore();
    store.markCelebration(11);
    store.markWalk(12);
    store.markSleep(13);

    expect(store.getSnapshot().lastCelebrationAt).toBe(11);
    expect(store.getSnapshot().lastWalkAt).toBe(12);
    expect(store.getSnapshot().lastSleepAt).toBe(13);
  });
});
