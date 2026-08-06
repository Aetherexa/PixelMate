import { describe, expect, it, vi } from "vitest";
import type { RuntimeMessageMiddleware } from "./runtimeMessageBus.js";
import { RuntimeMessageBus } from "./runtimeMessageBus.js";

describe("RuntimeMessageBus", () => {
  it("publishes to subscribers, supports once handlers, and runs middleware", () => {
    const bus = new RuntimeMessageBus<{ id: string }>({ name: "test-bus" });
    const seen: string[] = [];
    const middlewareHandler: RuntimeMessageMiddleware<{ id: string }> = (message, next) => {
      seen.push(`mw:${message.payload.id}`);
      next();
    };
    const middleware = vi.fn(middlewareHandler);

    bus.use(middleware);
    const unsubscribe = bus.subscribe((message) => {
      seen.push(message.payload.id);
    });
    const onceUnsubscribe = bus.once((message) => {
      seen.push(`once:${message.payload.id}`);
    });

    bus.publish({
      type: "PING",
      payload: { id: "first" },
      source: "test",
      target: "engine",
      version: 1,
      timestamp: 1
    });

    onceUnsubscribe();
    bus.publish({
      type: "PING",
      payload: { id: "second" },
      source: "test",
      target: "engine",
      version: 1,
      timestamp: 2
    });

    unsubscribe();
    bus.publish({
      type: "PING",
      payload: { id: "third" },
      source: "test",
      target: "engine",
      version: 1,
      timestamp: 3
    });

    expect(middleware).toHaveBeenCalledTimes(3);
    expect(seen).toEqual(["mw:first", "first", "once:first", "mw:second", "second", "mw:third"]);
  });
});
