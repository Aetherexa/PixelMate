import * as vscode from "vscode";
import { PIXELMATE_ALIVE_MESSAGE } from "./constants.js";

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand("pixelmate.alive", async () => {
    await vscode.window.showInformationMessage(PIXELMATE_ALIVE_MESSAGE);
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  return;
}