export type {
  CompanionBehavior,
  CompanionIntent,
  CompanionHooks,
  CompanionLifecycleState,
  CompanionMemorySnapshot,
  CompanionLocalization,
  CompanionManifest,
  NeedName,
  NeedsState,
  PersonalityId,
  PersonalityProfile,
  CompanionSnapshot,
  CompanionTheme,
  SpriteAssetManifest
} from "./model.js";
export type { CompanionEvent, CompanionEventType } from "./events.js";
export type { CompanionPersistence } from "./persistence.js";
export type { CompanionSettings } from "./settings.js";
export type { CompanionBehaviorPlugin } from "./plugins.js";

export { PIXELMATE_CORE_MANIFEST, DEFAULT_LOCALIZATION, DEFAULT_THEMES } from "./manifest.js";
export { DEFAULT_SETTINGS } from "./settings.js";
export { InMemoryPersistence } from "./persistence.js";
export { DEFAULT_MEMORY, CompanionMemoryStore } from "./memory.js";
export { DEFAULT_NEEDS, applyNeedEvent, updateNeedsByDrift } from "./needs.js";
export { getPersonalityProfile } from "./personality.js";
export { chooseIntent, type IntentContext } from "./intent.js";
export { CompanionScheduler } from "./scheduler.js";
export { PixelMateCompanionKernel } from "./kernel.js";
export {
  resolveCompanionDisplayState,
  type CompanionExpression,
  type CompanionEmotion,
  type CompanionEyeState,
  type CompanionSpeechBubble,
  type CompanionPresenceState
} from "./presence.js";
