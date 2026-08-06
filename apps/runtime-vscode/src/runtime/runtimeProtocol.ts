export const RUNTIME_PROTOCOL_VERSION = 1;

export const RUNTIME_MESSAGE_TYPES = {
  SHOW_COMPANION: "SHOW_COMPANION",
  HIDE_COMPANION: "HIDE_COMPANION",
  SET_MODE: "SET_MODE",
  PLAY_ANIMATION: "PLAY_ANIMATION",
  SET_THEME: "SET_THEME",
  SET_PERSONALITY: "SET_PERSONALITY",
  MOVE: "MOVE",
  SPEAK: "SPEAK",
  SLEEP: "SLEEP",
  WAKE: "WAKE",
  IDLE: "IDLE",
  OBSERVE: "OBSERVE",
  FOLLOW_CURSOR: "FOLLOW_CURSOR",
  FREEZE: "FREEZE",
  RESUME: "RESUME",
  ENABLE_DEBUG: "ENABLE_DEBUG",
  DISABLE_DEBUG: "DISABLE_DEBUG",
  EXPORT_FRAME: "EXPORT_FRAME",
  CAPTURE_SCREENSHOT: "CAPTURE_SCREENSHOT",
  LOAD_COMPANION: "LOAD_COMPANION",
  CHANGE_SKIN: "CHANGE_SKIN",
  PLAY_EFFECT: "PLAY_EFFECT",
  UNLOCK_ACHIEVEMENT: "UNLOCK_ACHIEVEMENT",
  SHOW_DIALOG: "SHOW_DIALOG",
  PING: "PING",
  READY: "READY",
  ACK: "ACK",
  ERROR: "ERROR",
  EVENT: "EVENT",
  REQUEST: "REQUEST",
  RESPONSE: "RESPONSE"
} as const;

export type RuntimeMessageType = (typeof RUNTIME_MESSAGE_TYPES)[keyof typeof RUNTIME_MESSAGE_TYPES];

export type RuntimeMode = "design" | "demo" | "screenshot" | "default";

export interface RuntimeMessage<TPayload = unknown> {
  readonly type: RuntimeMessageType;
  readonly payload: TPayload;
  readonly timestamp: number;
  readonly source: string;
  readonly target: string;
  readonly version: number;
}

export interface RuntimeEnvelope<TPayload = unknown> {
  readonly kind: "request" | "response" | "event" | "error";
  readonly message: RuntimeMessage<TPayload>;
}

export interface RuntimeCommandPayload {
  readonly mode?: RuntimeMode;
  readonly animation?: string;
  readonly theme?: string;
  readonly personality?: string;
  readonly text?: string;
  readonly x?: number;
  readonly y?: number;
  readonly companionId?: string;
  readonly transparent?: boolean;
  readonly debug?: boolean;
  readonly enabled?: boolean;
  readonly reason?: string;
  readonly detail?: string;
  readonly [key: string]: unknown;
}

export function createRuntimeMessage<TPayload>(
  type: RuntimeMessageType,
  payload: TPayload,
  source: string,
  target: string,
  version = RUNTIME_PROTOCOL_VERSION
): RuntimeMessage<TPayload> {
  return {
    type,
    payload,
    timestamp: Date.now(),
    source,
    target,
    version
  };
}

export function createRuntimeEnvelope<TPayload>(
  kind: RuntimeEnvelope<TPayload>["kind"],
  message: RuntimeMessage<TPayload>
): RuntimeEnvelope<TPayload> {
  return { kind, message };
}
