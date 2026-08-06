import { beforeEach, describe, expect, it, vi } from "vitest";
import { PIXELMATE_ALIVE_MESSAGE } from "./constants.js";

const showInformationMessage = vi.fn((message: string) => {
  void message;
  return Promise.resolve(undefined);
});
const registerCommand = vi.fn();

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
  });

  it("activates and registers alive command", async () => {
    let commandHandler: (() => Promise<void>) | undefined;
    registerCommand.mockImplementation(
      (_commandId: string, handler: () => Promise<void>) => {
        commandHandler = handler;
        return { dispose: () => undefined };
      }
    );

    const { activate } = await import("./extension.js");
    const context = {
      subscriptions: [] as Array<{ dispose: () => void }>
    } as unknown as Parameters<typeof activate>[0];

    activate(context);

    expect(registerCommand).toHaveBeenCalledTimes(1);
    expect(registerCommand).toHaveBeenCalledWith("pixelmate.alive", expect.any(Function));
    expect(context.subscriptions.length).toBe(1);

    if (commandHandler === undefined) {
      throw new Error("Expected command handler to be registered.");
    }

    await commandHandler();
    expect(showInformationMessage).toHaveBeenCalledWith(PIXELMATE_ALIVE_MESSAGE);
  });

  it("deactivate is callable", async () => {
    const { deactivate } = await import("./extension.js");
    expect(() => deactivate()).not.toThrow();
  });
});