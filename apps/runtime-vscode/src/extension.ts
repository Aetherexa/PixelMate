import * as vscode from "vscode";
import {
  PIXELMATE_ALIVE_COMMAND,
  PIXELMATE_ALIVE_MESSAGE,
  PIXELMATE_DEMO_MODE_COMMAND,
  PIXELMATE_DESIGN_MODE_COMMAND,
  PIXELMATE_SCREENSHOT_MODE_COMMAND,
  PIXELMATE_SHOW_COMPANION_COMMAND
} from "./constants.js";
import { RuntimeCompanionHost } from "./runtimeCompanionHost.js";
import { createRuntimeMessage, RUNTIME_MESSAGE_TYPES } from "./runtime/runtimeProtocol.js";

let host: RuntimeCompanionHost | undefined;

export function activate(context: vscode.ExtensionContext): void {
  host = new RuntimeCompanionHost(context);

  const aliveCommand = vscode.commands.registerCommand(PIXELMATE_ALIVE_COMMAND, () => {
    host?.send(
      createRuntimeMessage(
        RUNTIME_MESSAGE_TYPES.PING,
        { message: PIXELMATE_ALIVE_MESSAGE },
        "vscode",
        "runtime"
      )
    );
    void vscode.window.showInformationMessage(PIXELMATE_ALIVE_MESSAGE);
  });

  const showCompanionCommand = vscode.commands.registerCommand(
    PIXELMATE_SHOW_COMPANION_COMMAND,
    () => {
      host?.send(
        createRuntimeMessage(RUNTIME_MESSAGE_TYPES.SHOW_COMPANION, {}, "vscode", "runtime")
      );
    }
  );

  const demoModeCommand = vscode.commands.registerCommand(PIXELMATE_DEMO_MODE_COMMAND, () => {
    host?.setMode("demo");
  });

  const screenshotModeCommand = vscode.commands.registerCommand(
    PIXELMATE_SCREENSHOT_MODE_COMMAND,
    () => {
      host?.setMode("screenshot");
    }
  );

  const designModeCommand = vscode.commands.registerCommand(PIXELMATE_DESIGN_MODE_COMMAND, () => {
    host?.setMode("design");
  });

  context.subscriptions.push(
    aliveCommand,
    showCompanionCommand,
    demoModeCommand,
    screenshotModeCommand,
    designModeCommand,
    host
  );
}

export function deactivate(): void {
  host?.dispose();
  host = undefined;
  return;
}
