import type { CompanionBehavior } from "./model.js";
import type { CompanionSettings } from "./settings.js";

export type CompanionExpression =
  | "neutral"
  | "happy"
  | "sleepy"
  | "curious"
  | "thinking"
  | "confused"
  | "embarrassed"
  | "excited"
  | "proud"
  | "sad";

export type CompanionEmotion =
  "calm" | "excited" | "curious" | "sleepy" | "proud" | "surprised" | "thinking";

export interface CompanionEyeState {
  readonly id: string;
  readonly label: string;
}

export interface CompanionSpeechBubble {
  readonly text: string;
  readonly tone: "friendly" | "calm" | "playful";
}

export interface CompanionPresenceState {
  readonly expression: CompanionExpression;
  readonly emotion: CompanionEmotion;
  readonly eyes: CompanionEyeState;
  readonly particles: ReadonlyArray<string>;
  readonly speech: CompanionSpeechBubble | null;
  readonly allowSpeech: boolean;
}

export interface ResolveCompanionDisplayStateInput {
  readonly behavior: CompanionBehavior;
  readonly emotion: CompanionEmotion;
  readonly expression: CompanionExpression;
  readonly eyes: CompanionEyeState;
  readonly settings: CompanionSettings;
  readonly eventType: string | null;
  readonly idleMs: number;
  readonly now: number;
}

export function resolveCompanionDisplayState(
  input: ResolveCompanionDisplayStateInput
): CompanionPresenceState {
  const { behavior, emotion, expression, eyes, settings, eventType, idleMs, now } = input;

  let resolvedExpression: CompanionExpression = expression;
  let resolvedEmotion: CompanionEmotion = emotion;
  let resolvedEyes: CompanionEyeState = eyes;
  const particles: string[] = [];
  let speech: CompanionSpeechBubble | null = null;

  if (behavior === "celebrate" || eventType === "buildSuccess") {
    resolvedExpression = "excited";
    resolvedEmotion = "excited";
    resolvedEyes = { id: "happy", label: "Happy" };
    particles.push("sparkles", "confetti");
    speech = { text: "Nice work!", tone: "playful" };
  } else if (behavior === "sleep" || idleMs > 75_000 || eventType === "idleTimeout") {
    resolvedExpression = "sleepy";
    resolvedEmotion = "sleepy";
    resolvedEyes = { id: "sleep", label: "Sleep" };
    particles.push("sleep-z");
    speech = { text: "Taking a nap...", tone: "calm" };
  } else if (behavior === "wave" || eventType === "editorFocus") {
    resolvedExpression = "happy";
    resolvedEmotion = "curious";
    resolvedEyes = { id: "wide", label: "Wide" };
    speech = { text: "Hello!", tone: "friendly" };
  } else if (behavior === "think" || eventType === "diagnosticError") {
    resolvedExpression = "thinking";
    resolvedEmotion = "thinking";
    resolvedEyes = { id: "thinking", label: "Thinking" };
    speech = { text: "Thinking...", tone: "calm" };
  } else if (behavior === "walk") {
    resolvedExpression = "curious";
    resolvedEmotion = "curious";
    resolvedEyes = { id: "left", label: "Left" };
  }

  if (settings.accessibilityMode || settings.reduceMotion || settings.debugMode) {
    speech = null;
  }

  const allowSpeech = !settings.accessibilityMode && !settings.reduceMotion && now > 0;

  return {
    expression: resolvedExpression,
    emotion: resolvedEmotion,
    eyes: resolvedEyes,
    particles,
    speech,
    allowSpeech
  };
}
