import type { CompanionEventType } from "./events.js";
import type { CompanionIntent, NeedsState, PersonalityProfile } from "./model.js";

export interface IntentContext {
  readonly needs: NeedsState;
  readonly lastEventType: CompanionEventType | null;
  readonly isFocused: boolean;
  readonly hasErrors: boolean;
  readonly idleMs: number;
  readonly focusMode: boolean;
}

const IDLE_FOR_SLEEP_MS = 80_000;

function scoreIntents(context: IntentContext): Readonly<Record<CompanionIntent, number>> {
  const { needs, lastEventType, isFocused, idleMs, focusMode } = context;

  const eventCelebrateBoost =
    lastEventType === "buildSuccess" || lastEventType === "gitCommit" ? 40 : 0;
  const eventErrorWatchBoost =
    lastEventType === "buildError" || lastEventType === "diagnosticError" ? 30 : 0;

  return {
    explore: needs.curiosity + needs.attention * 0.2,
    rest: needs.rest + (100 - needs.energy) * 0.5,
    observe: needs.attention + needs.focus * 0.3,
    celebrate: needs.happiness * 0.7 + eventCelebrateBoost,
    sleep: needs.rest * 0.85 + (100 - needs.energy) * 0.9 + (idleMs >= IDLE_FOR_SLEEP_MS ? 25 : 0),
    followCursor: needs.attention * 0.8 + needs.curiosity * 0.25,
    wave: needs.happiness * 0.6 + (lastEventType === "editorFocus" ? 20 : 0),
    think: needs.focus * 0.85 + (isFocused ? 10 : 0),
    watch: needs.focus * 0.6 + eventErrorWatchBoost,
    hide: focusMode && isFocused ? 90 : 5
  };
}

export function chooseIntent(context: IntentContext, profile: PersonalityProfile): CompanionIntent {
  if (context.focusMode && context.isFocused) {
    return "hide";
  }

  if (context.hasErrors) {
    return "watch";
  }

  const base = scoreIntents(context);
  let bestIntent: CompanionIntent = "observe";
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const [intent, score] of Object.entries(base) as Array<[CompanionIntent, number]>) {
    const weighted = score * profile.intentWeights[intent];
    if (weighted > bestScore) {
      bestScore = weighted;
      bestIntent = intent;
    }
  }

  return bestIntent;
}
