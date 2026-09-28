import { describe, expect, it, vi } from "vitest";
import {
  createRuntimeEnvelope,
  createRuntimeMessage,
  RUNTIME_MESSAGE_TYPES,
  RUNTIME_PROTOCOL_VERSION
} from "./runtimeProtocol.js";

describe("runtime protocol", () => {
  it("creates versioned messages with the default protocol version", () => {
    vi.spyOn(Date, "now").mockReturnValue(123456);

    const message = createRuntimeMessage(
      RUNTIME_MESSAGE_TYPES.SET_MODE,
      { mode: "demo" as const },
      "vscode",
      "engine"
    );

    expect(message).toEqual({
      type: RUNTIME_MESSAGE_TYPES.SET_MODE,
      payload: { mode: "demo" },
      timestamp: 123456,
      source: "vscode",
      target: "engine",
      version: RUNTIME_PROTOCOL_VERSION
    });

    vi.restoreAllMocks();
  });

  it("supports an explicit protocol version", () => {
    const message = createRuntimeMessage(
      RUNTIME_MESSAGE_TYPES.PING,
      { message: "hello" },
      "test",
      "runtime",
      99
    );

    expect(message.version).toBe(99);
  });

  it("wraps messages in typed envelopes", () => {
    const message = createRuntimeMessage(
      RUNTIME_MESSAGE_TYPES.ACK,
      { ok: true },
      "runtime",
      "webview"
    );

    expect(createRuntimeEnvelope("response", message)).toEqual({
      kind: "response",
      message
    });
  });

  it("exposes the expected public message types", () => {
    expect(RUNTIME_MESSAGE_TYPES.SHOW_COMPANION).toBe("SHOW_COMPANION");
    expect(RUNTIME_MESSAGE_TYPES.HIDE_COMPANION).toBe("HIDE_COMPANION");
    expect(RUNTIME_MESSAGE_TYPES.PLAY_ANIMATION).toBe("PLAY_ANIMATION");
    expect(RUNTIME_MESSAGE_TYPES.CAPTURE_SCREENSHOT).toBe("CAPTURE_SCREENSHOT");
    expect(RUNTIME_MESSAGE_TYPES.ERROR).toBe("ERROR");
  });
});
