import type { CompanionBehavior, CompanionIntent, NeedsState } from "./model.js";

export interface SchedulerState {
  readonly needs: NeedsState;
  readonly intent: CompanionIntent;
  readonly behavior: CompanionBehavior;
}

export interface SchedulerTickContext {
  readonly deltaMs: number;
  readonly current: SchedulerState;
}

export interface SchedulerTickResult {
  readonly needs: NeedsState;
  readonly intent: CompanionIntent;
  readonly behavior: CompanionBehavior;
}

export class CompanionScheduler {
  public tick(
    context: SchedulerTickContext,
    runNeeds: (deltaMs: number, current: NeedsState) => NeedsState,
    runIntent: (needs: NeedsState) => CompanionIntent,
    runBehavior: (intent: CompanionIntent, needs: NeedsState) => CompanionBehavior
  ): SchedulerTickResult {
    const nextNeeds = runNeeds(context.deltaMs, context.current.needs);
    const nextIntent = runIntent(nextNeeds);
    const nextBehavior = runBehavior(nextIntent, nextNeeds);
    return {
      needs: nextNeeds,
      intent: nextIntent,
      behavior: nextBehavior
    };
  }
}
