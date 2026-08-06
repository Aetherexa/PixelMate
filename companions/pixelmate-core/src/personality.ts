import type { PersonalityId, PersonalityProfile } from "./model.js";

const PROFILES: Readonly<Record<PersonalityId, PersonalityProfile>> = {
  calm: {
    id: "calm",
    label: "Calm",
    reactionSpeed: 0.8,
    movementFrequency: 0.6,
    animationFrequencyBoost: 0.9,
    intentWeights: {
      explore: 0.7,
      rest: 1.2,
      observe: 1.2,
      celebrate: 0.8,
      sleep: 1.1,
      followCursor: 0.8,
      wave: 0.7,
      think: 1,
      watch: 1,
      hide: 0.6
    },
    behaviorBias: { breathing: 1.2, observe: 1.15 }
  },
  curious: {
    id: "curious",
    label: "Curious",
    reactionSpeed: 1.05,
    movementFrequency: 1.05,
    animationFrequencyBoost: 1,
    intentWeights: {
      explore: 1.3,
      rest: 0.8,
      observe: 1.1,
      celebrate: 0.95,
      sleep: 0.7,
      followCursor: 1.2,
      wave: 1,
      think: 1,
      watch: 1.1,
      hide: 0.5
    },
    behaviorBias: { lookLeft: 1.3, lookRight: 1.3, lookUp: 1.2, hop: 1.15 }
  },
  playful: {
    id: "playful",
    label: "Playful",
    reactionSpeed: 1.15,
    movementFrequency: 1.25,
    animationFrequencyBoost: 1.1,
    intentWeights: {
      explore: 1.2,
      rest: 0.75,
      observe: 0.9,
      celebrate: 1.3,
      sleep: 0.6,
      followCursor: 1.2,
      wave: 1.25,
      think: 0.7,
      watch: 0.8,
      hide: 0.4
    },
    behaviorBias: { tinyBounce: 1.35, smile: 1.2, hop: 1.25 }
  },
  focused: {
    id: "focused",
    label: "Focused",
    reactionSpeed: 0.95,
    movementFrequency: 0.7,
    animationFrequencyBoost: 0.85,
    intentWeights: {
      explore: 0.75,
      rest: 0.9,
      observe: 1,
      celebrate: 0.7,
      sleep: 0.85,
      followCursor: 0.85,
      wave: 0.6,
      think: 1.3,
      watch: 1.3,
      hide: 0.7
    },
    behaviorBias: { think: 1.4, observe: 1.25, breathing: 1.1 }
  },
  cheerful: {
    id: "cheerful",
    label: "Cheerful",
    reactionSpeed: 1.1,
    movementFrequency: 1,
    animationFrequencyBoost: 1.05,
    intentWeights: {
      explore: 1,
      rest: 0.8,
      observe: 1,
      celebrate: 1.4,
      sleep: 0.65,
      followCursor: 1,
      wave: 1.3,
      think: 0.8,
      watch: 0.95,
      hide: 0.3
    },
    behaviorBias: { smile: 1.45, wave: 1.25, celebrate: 1.2 }
  }
};

export function getPersonalityProfile(personality: PersonalityId): PersonalityProfile {
  return PROFILES[personality];
}
