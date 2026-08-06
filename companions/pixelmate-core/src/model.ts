export type CompanionLifecycleState =
  "loading" | "stopped" | "running" | "sleeping" | "paused" | "disposed";

export type CompanionBehavior =
  | "idle"
  | "walk"
  | "blink"
  | "doubleBlink"
  | "lookLeft"
  | "lookRight"
  | "lookUp"
  | "lookDown"
  | "stretch"
  | "hop"
  | "scratchHead"
  | "sit"
  | "stand"
  | "tinyBounce"
  | "breathing"
  | "wave"
  | "celebrate"
  | "sleep"
  | "wake"
  | "lookAtCursor"
  | "turnAround"
  | "observe"
  | "smile"
  | "randomIdleShift"
  | "think"
  | "hide";

export type CompanionIntent =
  | "explore"
  | "rest"
  | "observe"
  | "celebrate"
  | "sleep"
  | "followCursor"
  | "wave"
  | "think"
  | "watch"
  | "hide";

export type NeedName =
  "curiosity" | "energy" | "attention" | "comfort" | "happiness" | "rest" | "focus";

export interface NeedsState {
  readonly curiosity: number;
  readonly energy: number;
  readonly attention: number;
  readonly comfort: number;
  readonly happiness: number;
  readonly rest: number;
  readonly focus: number;
}

export type PersonalityId = "calm" | "curious" | "playful" | "focused" | "cheerful";

export interface PersonalityProfile {
  readonly id: PersonalityId;
  readonly label: string;
  readonly reactionSpeed: number;
  readonly movementFrequency: number;
  readonly animationFrequencyBoost: number;
  readonly intentWeights: Readonly<Record<CompanionIntent, number>>;
  readonly behaviorBias: Readonly<Partial<Record<CompanionBehavior, number>>>;
}

export interface CompanionMemorySnapshot {
  readonly lastBuildStatus: "none" | "success" | "error";
  readonly lastErrorAt: number | null;
  readonly lastInteractionAt: number | null;
  readonly lastCelebrationAt: number | null;
  readonly currentWorkspace: string;
  readonly openFilesCount: number;
  readonly sessionLengthMs: number;
  readonly lastWalkAt: number | null;
  readonly lastSleepAt: number | null;
}

export interface CompanionManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly personality: ReadonlyArray<PersonalityId>;
  readonly supportedBehaviors: ReadonlyArray<CompanionBehavior>;
  readonly supportedIntents: ReadonlyArray<CompanionIntent>;
  readonly localization: ReadonlyArray<string>;
  readonly themes: ReadonlyArray<string>;
}

export interface SpriteAssetManifest {
  readonly behaviors: Readonly<Record<CompanionBehavior, ReadonlyArray<string>>>;
}

export interface CompanionLocalization {
  readonly locale: string;
  readonly labels: Readonly<Record<CompanionBehavior, string>>;
}

export interface CompanionTheme {
  readonly id: string;
  readonly displayName: string;
  readonly backgroundColor: string;
  readonly accentColor: string;
}

export interface CompanionHooks {
  readonly sound: {
    play(effect: string): void;
  };
  readonly particles: {
    emit(effect: string): void;
  };
}

export interface CompanionMetrics {
  readonly ticks: number;
  readonly eventsProcessed: number;
  readonly lastTickDurationMs: number;
  readonly frameTimeMs: number;
  readonly fps: number;
  readonly idleCpuHint: "low" | "active";
}

export interface CompanionSnapshot {
  readonly state: CompanionLifecycleState;
  readonly intent: CompanionIntent;
  readonly behavior: CompanionBehavior;
  readonly frame: string;
  readonly lifecycle: CompanionLifecycleState;
  readonly idleMs: number;
  readonly locale: string;
  readonly personality: PersonalityId;
  readonly needs: NeedsState;
  readonly memory: CompanionMemorySnapshot;
  readonly theme: string;
  readonly reducedMotion: boolean;
  readonly debug: {
    readonly behaviorQueue: ReadonlyArray<CompanionBehavior>;
    readonly lastEventType: string | null;
  };
  readonly metrics: CompanionMetrics;
}
