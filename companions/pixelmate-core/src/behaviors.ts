import type { CompanionEventType } from "./events.js";
import type {
  CompanionBehavior,
  CompanionIntent,
  NeedsState,
  PersonalityProfile
} from "./model.js";
import type { CompanionSettings } from "./settings.js";

export interface BehaviorContext {
  readonly settings: CompanionSettings;
  readonly intent: CompanionIntent;
  readonly needs: NeedsState;
  readonly personality: PersonalityProfile;
  readonly idleMs: number;
  readonly editorFocused: boolean;
  readonly hasErrors: boolean;
  readonly lastEventType: CompanionEventType | null;
  readonly randomSeed: number;
  readonly now: number;
  readonly lastBehavior: CompanionBehavior;
  readonly cooldowns: Readonly<Partial<Record<CompanionBehavior, number>>>;
}

const IDLE_SLEEP_THRESHOLD_MS = 75_000;

function canRun(
  behavior: CompanionBehavior,
  now: number,
  cooldowns: Readonly<Partial<Record<CompanionBehavior, number>>>
): boolean {
  return (cooldowns[behavior] ?? 0) <= now;
}

function chooseDeterministic(
  options: ReadonlyArray<CompanionBehavior>,
  randomSeed: number
): CompanionBehavior {
  if (options.length === 0) {
    return "idle";
  }
  return options[Math.abs(randomSeed) % options.length] ?? options[0] ?? "idle";
}

function asIdle(settings: CompanionSettings): CompanionBehavior {
  return settings.idleBehavior === "observe" ? "observe" : "idle";
}

function intentCandidates(intent: CompanionIntent): ReadonlyArray<CompanionBehavior> {
  switch (intent) {
    case "explore":
      return ["walk", "lookLeft", "lookRight", "lookUp", "lookDown", "turnAround", "hop"];
    case "rest":
      return ["breathing", "sit", "randomIdleShift", "stretch"];
    case "observe":
      return ["observe", "lookLeft", "lookRight", "lookAtCursor", "think"];
    case "celebrate":
      return ["celebrate", "tinyBounce", "smile", "wave"];
    case "sleep":
      return ["sleep"];
    case "followCursor":
      return ["lookAtCursor", "walk", "lookLeft", "lookRight"];
    case "wave":
      return ["wave", "smile"];
    case "think":
      return ["think", "observe", "breathing"];
    case "watch":
      return ["observe", "lookAtCursor", "think"];
    case "hide":
      return ["hide", "sleep"];
    default:
      return ["idle"];
  }
}

export function decideBehavior(context: BehaviorContext): CompanionBehavior {
  const {
    settings,
    intent,
    needs,
    personality,
    idleMs,
    editorFocused,
    hasErrors,
    lastEventType,
    randomSeed,
    now,
    lastBehavior,
    cooldowns
  } = context;

  if (settings.focusMode && editorFocused) {
    return "hide";
  }

  if (idleMs >= IDLE_SLEEP_THRESHOLD_MS || lastEventType === "idleTimeout") {
    return "sleep";
  }

  if (lastEventType === "buildSuccess") {
    return "celebrate";
  }

  if (hasErrors || lastEventType === "buildError" || lastEventType === "diagnosticError") {
    return canRun("think", now, cooldowns) ? "think" : "observe";
  }

  if (lastEventType === "editorFocus") {
    return "wave";
  }

  if (!editorFocused || lastEventType === "editorBlur") {
    return "observe";
  }

  if (lastBehavior === "sleep" && canRun("wake", now, cooldowns)) {
    return "wake";
  }

  if (needs.energy < 22 || needs.rest > 80) {
    return "sleep";
  }

  const candidates = intentCandidates(intent).filter((behavior) =>
    canRun(behavior, now, cooldowns)
  );
  if (candidates.length === 0) {
    return asIdle(settings);
  }

  const weighted: CompanionBehavior[] = candidates.flatMap((behavior) => {
    const personalityBias = personality.behaviorBias[behavior] ?? 1;
    const intensity = 0.6 + settings.behaviorIntensity;
    const score = Math.max(1, Math.round(personalityBias * intensity));
    return Array<CompanionBehavior>(score).fill(behavior);
  });

  const selected = chooseDeterministic(weighted, randomSeed);

  const microBehaviorBucket = randomSeed % 18;
  if (microBehaviorBucket === 0 && canRun("doubleBlink", now, cooldowns)) {
    return "doubleBlink";
  }
  if (microBehaviorBucket === 1 && canRun("blink", now, cooldowns)) {
    return "blink";
  }
  if (microBehaviorBucket === 2 && canRun("scratchHead", now, cooldowns)) {
    return "scratchHead";
  }

  return selected;
}
