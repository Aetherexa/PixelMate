import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PIXELMATE_ALIVE_COMMAND,
  PIXELMATE_ALIVE_MESSAGE,
  PIXELMATE_SHOW_COMPANION_COMMAND
} from "./constants.js";

const showInformationMessage = vi.fn((message: string) => {
  void message;
  return Promise.resolve(undefined);
});
const registerCommand = vi.fn();
const show = vi.fn();
const dispose = vi.fn();
const send = vi.fn();
const setMode = vi.fn();

vi.mock("./runtimeCompanionHost.js", () => ({
  RuntimeCompanionHost: vi.fn().mockImplementation(() => ({
    show,
    dispose,
    send,
    setMode
  }))
}));

vi.mock("vscode", () => ({
  commands: {
    registerCommand
  },
  window: {
    showInformationMessage
  }
}));

describe("runtime-vscode extension", () => {
  beforeEach(() => {
    showInformationMessage.mockClear();
    registerCommand.mockClear();
    show.mockClear();
    dispose.mockClear();
    send.mockClear();
    setMode.mockClear();
  });

  it("activates and registers runtime commands", async () => {
    const handlers = new Map<string, () => Promise<void>>();
    registerCommand.mockImplementation((commandId: string, handler: () => Promise<void>) => {
      handlers.set(commandId, handler);
      return { dispose: () => undefined };
    });

    const { activate } = await import("./extension.js");
    const context = {
      subscriptions: [] as Array<{ dispose: () => void }>
    } as unknown as Parameters<typeof activate>[0];

    activate(context);

    expect(registerCommand).toHaveBeenCalledTimes(5);
    expect(handlers.has(PIXELMATE_ALIVE_COMMAND)).toBe(true);
    expect(handlers.has(PIXELMATE_SHOW_COMPANION_COMMAND)).toBe(true);
    expect(context.subscriptions.length).toBe(6);

    const aliveHandler = handlers.get(PIXELMATE_ALIVE_COMMAND);
    const showHandler = handlers.get(PIXELMATE_SHOW_COMPANION_COMMAND);
    if (aliveHandler === undefined || showHandler === undefined) {
      throw new Error("Expected command handlers to be registered.");
    }

    await aliveHandler();
    await showHandler();
    expect(showInformationMessage).toHaveBeenCalledWith(PIXELMATE_ALIVE_MESSAGE);
    expect(send).toHaveBeenCalledTimes(2);
    expect(show).not.toHaveBeenCalled();
  });

  it("deactivate disposes host", async () => {
    const { deactivate } = await import("./extension.js");
    expect(() => deactivate()).not.toThrow();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
