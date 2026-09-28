import type { PersonalityId } from "./model.js";

export type CompanionType = "smiley" | "cat" | "dog" | "horse";

export interface CompanionPosition {
  readonly x: number;
  readonly y: number;
}

export interface CompanionSettings {
  readonly companionType: CompanionType;
  readonly scale: number;
  readonly speed: number;
  readonly movementSpeed: number;
  readonly position: CompanionPosition;
  readonly theme: string;
  readonly animationFrequency: number;
  readonly idleBehavior: "idle" | "observe";
  readonly personality: PersonalityId;
  readonly behaviorIntensity: number;
  readonly accessibilityMode: boolean;
  readonly focusMode: boolean;
  readonly reduceMotion: boolean;
  readonly debugMode: boolean;
  readonly speechEnabled: boolean;
  readonly autoSleep: boolean;
}

export const DEFAULT_SETTINGS: CompanionSettings = {
  companionType: "smiley",
  scale: 1,
  speed: 1,
  movementSpeed: 1,
  position: { x: 0.85, y: 0.85 },
  theme: "default",
  animationFrequency: 1,
  personality: "calm",
  behaviorIntensity: 0.55,
  idleBehavior: "observe",
  accessibilityMode: false,
  focusMode: false,
  reduceMotion: false,
  debugMode: false,
  speechEnabled: true,
  autoSleep: true
};

export function mergeSettings(
  current: CompanionSettings,
  partial: Partial<CompanionSettings>
): CompanionSettings {
  return {
    ...current,
    ...partial,
    position: {
      ...current.position,
      ...partial.position
    }
  };
}
