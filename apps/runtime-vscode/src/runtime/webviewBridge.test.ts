import { describe, expect, it, vi } from "vitest";
import { WebviewBridge } from "./webviewBridge.js";

describe("WebviewBridge", () => {
  it("subscribes, emits, and unsubscribes listeners", () => {
    const bridge = new WebviewBridge();
    const listener = vi.fn();
    const unsubscribe = bridge.onMessage(listener);

    bridge.emit({ type: "event", payload: { ok: true } });
    expect(listener).toHaveBeenCalledWith({ type: "event", payload: { ok: true } });

    unsubscribe();
    bridge.emit({ type: "event", payload: { ok: false } });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("creates a request id, emits the request, and resolves on response", async () => {
    const bridge = new WebviewBridge();
    let emittedRequestId = "";

    bridge.onMessage((message) => {
      if (message.type === "ping" && message.requestId !== undefined) {
        emittedRequestId = message.requestId;
        bridge.receive({
          type: "response",
          requestId: message.requestId,
          payload: { pong: true }
        });
      }
    });

    const response = await bridge.request<{ pong: boolean }>({ type: "ping" });

    expect(emittedRequestId).toMatch(/^req-/);
    expect(response).toEqual({ pong: true });
  });

  it("preserves an explicit request id", async () => {
    const bridge = new WebviewBridge();

    bridge.onMessage((message) => {
      if (message.requestId === "fixed-id") {
        bridge.receive({
          type: "response",
          requestId: "fixed-id",
          payload: "done"
        });
      }
    });

    await expect(
      bridge.request<string>({ type: "ping", requestId: "fixed-id" })
    ).resolves.toBe("done");
  });

  it("respond emits a response message", () => {
    const bridge = new WebviewBridge();
    const listener = vi.fn();
    bridge.onMessage(listener);

    bridge.respond("r1", { ok: true });

    expect(listener).toHaveBeenCalledWith({
      type: "response",
      payload: { ok: true },
      requestId: "r1"
    });
  });

  it("forwards non-response messages through receive", () => {
    const bridge = new WebviewBridge();
    const listener = vi.fn();
    bridge.onMessage(listener);

    bridge.receive({ type: "event", payload: 42 });

    expect(listener).toHaveBeenCalledWith({ type: "event", payload: 42 });
  });
});
