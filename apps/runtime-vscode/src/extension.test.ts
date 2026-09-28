import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PIXELMATE_ALIVE_COMMAND,
  PIXELMATE_ALIVE_MESSAGE,
  PIXELMATE_SELECT_COMPANION_COMMAND,
  PIXELMATE_SHOW_COMPANION_COMMAND
} from "./constants.js";

const showInformationMessage = vi.fn((message: string) => {
  void message;
  return Promise.resolve(undefined);
});
const showQuickPick = vi.fn();
const updateConfiguration = vi.fn(() => Promise.resolve());
const getConfiguration = vi.fn(() => ({
  update: updateConfiguration
}));
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
    showInformationMessage,
    showQuickPick
  },
  workspace: {
    getConfiguration
  },
  ConfigurationTarget: {
    Global: 1
  }
}));

describe("runtime-vscode extension", () => {
  beforeEach(() => {
    showInformationMessage.mockClear();
    showQuickPick.mockReset();
    updateConfiguration.mockClear();
    getConfiguration.mockClear();
    registerCommand.mockClear();
    show.mockClear();
    dispose.mockClear();
    send.mockClear();
    setMode.mockClear();
  });

  it("activates and registers runtime commands", async () => {
    const handlers = new Map<string, () => unknown>();
    registerCommand.mockImplementation((commandId: string, handler: () => unknown) => {
      handlers.set(commandId, handler);
      return { dispose: () => undefined };
    });

    const { activate } = await import("./extension.js");
    const context = {
      subscriptions: [] as Array<{ dispose: () => void }>
    } as unknown as Parameters<typeof activate>[0];

    activate(context);

    expect(registerCommand).toHaveBeenCalledTimes(6);
    expect(handlers.has(PIXELMATE_ALIVE_COMMAND)).toBe(true);
    expect(handlers.has(PIXELMATE_SHOW_COMPANION_COMMAND)).toBe(true);
    expect(handlers.has(PIXELMATE_SELECT_COMPANION_COMMAND)).toBe(true);
    expect(context.subscriptions.length).toBe(7);

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

  it("updates the selected companion and reveals PixelMate", async () => {
    showQuickPick.mockResolvedValue({ label: "🐱 Cat", value: "cat" });

    const handlers = new Map<string, () => unknown>();
    registerCommand.mockImplementation((commandId: string, handler: () => unknown) => {
      handlers.set(commandId, handler);
      return { dispose: () => undefined };
    });

    const { activate } = await import("./extension.js");
    const context = {
      subscriptions: [] as Array<{ dispose: () => void }>
    } as unknown as Parameters<typeof activate>[0];

    activate(context);

    const selectHandler = handlers.get(PIXELMATE_SELECT_COMPANION_COMMAND);
    if (selectHandler === undefined) {
      throw new Error("Expected companion selector command to be registered.");
    }

    await selectHandler();

    expect(getConfiguration).toHaveBeenCalledWith("pixelmate.companion");
    expect(updateConfiguration).toHaveBeenCalledWith("type", "cat", 1);
    expect(show).toHaveBeenCalledTimes(1);
  });

  it("does not update settings when companion selection is cancelled", async () => {
    showQuickPick.mockResolvedValue(undefined);

    const handlers = new Map<string, () => unknown>();
    registerCommand.mockImplementation((commandId: string, handler: () => unknown) => {
      handlers.set(commandId, handler);
      return { dispose: () => undefined };
    });

    const { activate } = await import("./extension.js");
    const context = {
      subscriptions: [] as Array<{ dispose: () => void }>
    } as unknown as Parameters<typeof activate>[0];

    activate(context);

    const selectHandler = handlers.get(PIXELMATE_SELECT_COMPANION_COMMAND);
    if (selectHandler === undefined) {
      throw new Error("Expected companion selector command to be registered.");
    }

    await selectHandler();

    expect(updateConfiguration).not.toHaveBeenCalled();
  });

  it("deactivate disposes host", async () => {
    const { deactivate } = await import("./extension.js");
    expect(() => deactivate()).not.toThrow();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
