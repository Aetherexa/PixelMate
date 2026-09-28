import { describe, expect, it, vi } from "vitest";
import type { RuntimeMessageMiddleware } from "./runtimeMessageBus.js";
import { RuntimeMessageBus } from "./runtimeMessageBus.js";

const message = (id: string) => ({
  type: "PING",
  payload: { id },
  source: "test",
  target: "engine",
  version: 1,
  timestamp: 1
});

describe("RuntimeMessageBus", () => {
  it("publishes to subscribers, supports once handlers, and runs middleware", () => {
    const bus = new RuntimeMessageBus<{ id: string }>({ name: "test-bus" });
    const seen: string[] = [];
    const middlewareHandler: RuntimeMessageMiddleware<{ id: string }> = (event, next) => {
      seen.push(`mw:${event.payload.id}`);
      next();
    };
    const middleware = vi.fn(middlewareHandler);

    bus.use(middleware);
    const unsubscribe = bus.subscribe((event) => {
      seen.push(event.payload.id);
    });
    const onceUnsubscribe = bus.once((event) => {
      seen.push(`once:${event.payload.id}`);
    });

    bus.publish(message("first"));

    onceUnsubscribe();
    bus.publish(message("second"));

    unsubscribe();
    bus.publish(message("third"));

    expect(middleware).toHaveBeenCalledTimes(3);
    expect(seen).toEqual(["mw:first", "first", "once:first", "mw:second", "second", "mw:third"]);
  });

  it("runs middleware in registration order before subscribers", () => {
    const bus = new RuntimeMessageBus<{ id: string }>();
    const seen: string[] = [];

    bus.use((event, next) => {
      seen.push(`first:${event.payload.id}`);
      next();
    });
    bus.use((event, next) => {
      seen.push(`second:${event.payload.id}`);
      next();
    });
    bus.subscribe((event) => {
      seen.push(`subscriber:${event.payload.id}`);
    });

    bus.publish(message("ordered"));

    expect(seen).toEqual(["first:ordered", "second:ordered", "subscriber:ordered"]);
  });

  it("allows middleware to stop dispatch by not calling next", () => {
    const bus = new RuntimeMessageBus<{ id: string }>();
    const subscriber = vi.fn();

    bus.use(() => undefined);
    bus.subscribe(subscriber);
    bus.publish(message("blocked"));

    expect(subscriber).not.toHaveBeenCalled();
  });

  it("supports explicit unsubscribe for normal and once listeners", () => {
    const bus = new RuntimeMessageBus<{ id: string }>();
    const handler = vi.fn();

    bus.subscribe(handler);
    bus.once(handler);
    bus.unsubscribe(handler);
    bus.publish(message("ignored"));

    expect(handler).not.toHaveBeenCalled();
  });

  it("broadcast delegates to publish and logs trace entries", () => {
    const logger = vi.fn();
    const bus = new RuntimeMessageBus<{ id: string }>({ name: "pixelmate-test", logger });
    const subscriber = vi.fn();
    bus.subscribe(subscriber);

    bus.broadcast(message("broadcast"));

    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(logger).toHaveBeenCalledWith("publish:PING");
    expect(bus.debugTrace()).toBe("pixelmate-test: listeners=1, once=0");
  });

  it("uses the default bus name in debug traces", () => {
    const bus = new RuntimeMessageBus();
    expect(bus.debugTrace()).toBe("runtime-message-bus: listeners=0, once=0");
  });
});
