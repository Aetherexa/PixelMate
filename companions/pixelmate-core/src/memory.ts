import type { CompanionEvent } from "./events.js";
import type { CompanionMemorySnapshot } from "./model.js";

export const DEFAULT_MEMORY: CompanionMemorySnapshot = {
  lastBuildStatus: "none",
  lastErrorAt: null,
  lastInteractionAt: null,
  lastCelebrationAt: null,
  currentWorkspace: "unknown",
  openFilesCount: 0,
  sessionLengthMs: 0,
  lastWalkAt: null,
  lastSleepAt: null
};

export class CompanionMemoryStore {
  private memory: CompanionMemorySnapshot;

  public constructor(initial: CompanionMemorySnapshot = DEFAULT_MEMORY) {
    this.memory = initial;
  }

  public getSnapshot(): CompanionMemorySnapshot {
    return this.memory;
  }

  public advanceSession(deltaMs: number): void {
    this.memory = {
      ...this.memory,
      sessionLengthMs: Math.max(0, this.memory.sessionLengthMs + Math.max(0, deltaMs))
    };
  }

  public onEvent(event: CompanionEvent): void {
    let next: CompanionMemorySnapshot = this.memory;

    if (
      event.type === "activity" ||
      event.type === "typingStarted" ||
      event.type === "editorFocus"
    ) {
      next = { ...next, lastInteractionAt: event.at };
    }

    if (event.type === "buildSuccess") {
      next = { ...next, lastBuildStatus: "success" };
    }

    if (event.type === "buildError" || event.type === "diagnosticError") {
      next = { ...next, lastBuildStatus: "error", lastErrorAt: event.at };
    }

    if (event.type === "workspaceLoaded") {
      const workspace =
        typeof event.payload?.["workspace"] === "string" ? event.payload["workspace"] : "workspace";
      next = { ...next, currentWorkspace: workspace };
    }

    if (event.type === "openFilesChanged") {
      const count = Number(event.payload?.["count"] ?? next.openFilesCount);
      next = {
        ...next,
        openFilesCount: Number.isFinite(count)
          ? Math.max(0, Math.floor(count))
          : next.openFilesCount
      };
    }

    this.memory = next;
  }

  public markCelebration(at: number): void {
    this.memory = { ...this.memory, lastCelebrationAt: at };
  }

  public markWalk(at: number): void {
    this.memory = { ...this.memory, lastWalkAt: at };
  }

  public markSleep(at: number): void {
    this.memory = { ...this.memory, lastSleepAt: at };
  }
}
