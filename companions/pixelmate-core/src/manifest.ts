import type {
  CompanionLocalization,
  CompanionManifest,
  CompanionTheme,
  SpriteAssetManifest
} from "./model.js";

export const PIXELMATE_CORE_MANIFEST: CompanionManifest = {
  id: "pixelmate-core",
  name: "PixelMate Core",
  version: "0.1.0-alpha",
  personality: ["calm", "curious", "playful", "focused", "cheerful"],
  supportedBehaviors: [
    "idle",
    "walk",
    "blink",
    "doubleBlink",
    "lookLeft",
    "lookRight",
    "lookUp",
    "lookDown",
    "stretch",
    "hop",
    "scratchHead",
    "sit",
    "stand",
    "tinyBounce",
    "breathing",
    "wave",
    "celebrate",
    "sleep",
    "wake",
    "lookAtCursor",
    "turnAround",
    "observe",
    "smile",
    "randomIdleShift",
    "think",
    "hide"
  ],
  supportedIntents: [
    "explore",
    "rest",
    "observe",
    "celebrate",
    "sleep",
    "followCursor",
    "wave",
    "think",
    "watch",
    "hide"
  ],
  localization: ["en"],
  themes: ["default", "ocean", "sunrise"]
};

export const DEFAULT_PLACEHOLDER_SPRITES: SpriteAssetManifest = {
  behaviors: {
    idle: ["idle-1", "idle-2", "idle-3"],
    walk: ["walk-1", "walk-2", "walk-3", "walk-4"],
    blink: ["blink-1", "blink-2"],
    doubleBlink: ["dbl-blink-1", "dbl-blink-2", "dbl-blink-3"],
    lookLeft: ["left-1", "left-2"],
    lookRight: ["right-1", "right-2"],
    lookUp: ["up-1", "up-2"],
    lookDown: ["down-1", "down-2"],
    stretch: ["stretch-1", "stretch-2", "stretch-3"],
    hop: ["hop-1", "hop-2", "hop-3"],
    scratchHead: ["scratch-1", "scratch-2"],
    sit: ["sit-1", "sit-2"],
    stand: ["stand-1", "stand-2"],
    tinyBounce: ["bounce-1", "bounce-2", "bounce-3"],
    breathing: ["breathe-1", "breathe-2", "breathe-3"],
    wave: ["wave-1", "wave-2", "wave-3"],
    celebrate: ["celebrate-1", "celebrate-2", "celebrate-3"],
    sleep: ["sleep-1", "sleep-2"],
    wake: ["wake-1", "wake-2"],
    lookAtCursor: ["cursor-look-1", "cursor-look-2", "cursor-look-3"],
    turnAround: ["turn-1", "turn-2", "turn-3"],
    observe: ["observe-1", "observe-2", "observe-3"],
    smile: ["smile-1", "smile-2"],
    randomIdleShift: ["idle-shift-1", "idle-shift-2"],
    think: ["think-1", "think-2", "think-3"],
    hide: ["hide-1", "hide-2"]
  }
};

export const DEFAULT_LOCALIZATION: CompanionLocalization = {
  locale: "en",
  labels: {
    idle: "Idle",
    walk: "Walking",
    blink: "Blinking",
    doubleBlink: "Double Blink",
    lookLeft: "Looking Left",
    lookRight: "Looking Right",
    lookUp: "Looking Up",
    lookDown: "Looking Down",
    stretch: "Stretching",
    hop: "Hopping",
    scratchHead: "Scratching Head",
    sit: "Sitting",
    stand: "Standing",
    tinyBounce: "Tiny Bounce",
    breathing: "Breathing",
    wave: "Waving",
    celebrate: "Celebrating",
    sleep: "Sleeping",
    wake: "Waking",
    lookAtCursor: "Looking At Cursor",
    turnAround: "Turning Around",
    observe: "Observing",
    smile: "Smiling",
    randomIdleShift: "Idle Shift",
    think: "Thinking",
    hide: "Hiding"
  }
};

export const DEFAULT_THEMES: ReadonlyArray<CompanionTheme> = [
  {
    id: "default",
    displayName: "Default",
    backgroundColor: "#0E2439",
    accentColor: "#00B4D8"
  },
  {
    id: "ocean",
    displayName: "Ocean",
    backgroundColor: "#12324A",
    accentColor: "#4FD1C5"
  },
  {
    id: "sunrise",
    displayName: "Sunrise",
    backgroundColor: "#3A2C2C",
    accentColor: "#FF9E6D"
  }
];
