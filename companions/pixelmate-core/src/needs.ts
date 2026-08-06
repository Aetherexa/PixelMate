import type { CompanionEvent, CompanionEventType } from "./events.js";
import type { NeedsState } from "./model.js";

const MIN_NEED = 0;
const MAX_NEED = 100;

const DRIFT_PER_SECOND: NeedsState = {
  curiosity: 0.5,
  energy: -0.9,
  attention: -0.6,
  comfort: -0.25,
  happiness: -0.12,
  rest: 0.8,
  focus: -0.4
};

const EVENT_EFFECTS: Readonly<Record<CompanionEventType, Partial<NeedsState>>> = {
  vscodeStarted: { curiosity: 3, attention: 2, energy: 1 },
  workspaceLoaded: { curiosity: 4, focus: 3, attention: 2 },
  workspaceClosed: { focus: -6, rest: 6 },
  editorChanged: { curiosity: 2, focus: 2 },
  typingStarted: { focus: 5, energy: -4, curiosity: -2, attention: 2 },
  typingStopped: { rest: 3, focus: -2 },
  cursorIdle: { rest: 4, attention: -2 },
  editorFocus: { attention: 3, focus: 3 },
  editorBlur: { attention: -4, rest: 4 },
  buildStarted: { focus: 6, comfort: -3 },
  buildSuccess: { happiness: 8, comfort: 5, energy: -1 },
  buildError: { happiness: -6, comfort: -7, focus: 3 },
  gitCommit: { happiness: 5, comfort: 2, curiosity: 1 },
  terminalRunning: { focus: 3, energy: -2 },
  themeChanged: { curiosity: 2, happiness: 2 },
  windowFocus: { attention: 3 },
  windowBlur: { attention: -5, rest: 3 },
  idleTime: { rest: 5, focus: -3 },
  diagnosticError: { comfort: -5, focus: 2, happiness: -3 },
  diagnosticClear: { comfort: 4, happiness: 3 },
  idleTimeout: { rest: 4, focus: -3, attention: -2 },
  activity: { attention: 2, focus: 1 },
  openFilesChanged: { curiosity: 1, attention: 1 }
};

export const DEFAULT_NEEDS: NeedsState = {
  curiosity: 56,
  energy: 70,
  attention: 50,
  comfort: 65,
  happiness: 62,
  rest: 20,
  focus: 48
};

function clamp(value: number): number {
  return Math.min(MAX_NEED, Math.max(MIN_NEED, value));
}

export function updateNeedsByDrift(current: NeedsState, deltaMs: number): NeedsState {
  const seconds = Math.max(0, deltaMs) / 1000;
  return {
    curiosity: clamp(current.curiosity + DRIFT_PER_SECOND.curiosity * seconds),
    energy: clamp(current.energy + DRIFT_PER_SECOND.energy * seconds),
    attention: clamp(current.attention + DRIFT_PER_SECOND.attention * seconds),
    comfort: clamp(current.comfort + DRIFT_PER_SECOND.comfort * seconds),
    happiness: clamp(current.happiness + DRIFT_PER_SECOND.happiness * seconds),
    rest: clamp(current.rest + DRIFT_PER_SECOND.rest * seconds),
    focus: clamp(current.focus + DRIFT_PER_SECOND.focus * seconds)
  };
}

export function applyNeedEvent(current: NeedsState, event: CompanionEvent): NeedsState {
  const effect = EVENT_EFFECTS[event.type];
  if (effect === undefined) {
    return current;
  }

  return {
    curiosity: clamp(current.curiosity + (effect.curiosity ?? 0)),
    energy: clamp(current.energy + (effect.energy ?? 0)),
    attention: clamp(current.attention + (effect.attention ?? 0)),
    comfort: clamp(current.comfort + (effect.comfort ?? 0)),
    happiness: clamp(current.happiness + (effect.happiness ?? 0)),
    rest: clamp(current.rest + (effect.rest ?? 0)),
    focus: clamp(current.focus + (effect.focus ?? 0))
  };
}
