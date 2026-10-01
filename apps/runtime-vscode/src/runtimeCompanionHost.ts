import * as vscode from "vscode";
import {
  DEFAULT_SETTINGS,
  PixelMateCompanionKernel,
  type CompanionPersistence,
  type CompanionSettings,
  type CompanionSnapshot
} from "@aetherexa/pixelmate-core";
import { AssetLoader, createCompanionAssetManifest } from "@aetherexa/asset-loader";
import { AnimationPlayer, createAnimationClip } from "@aetherexa/animation";
import { buildRenderFrame } from "@aetherexa/renderer";
import { RuntimeMessageBus } from "./runtime/messageBus/runtimeMessageBus.js";
import {
  createRuntimeEnvelope,
  createRuntimeMessage,
  RUNTIME_MESSAGE_TYPES,
  type RuntimeCommandPayload,
  type RuntimeMessage,
  type RuntimeMode
} from "./runtime/runtimeProtocol.js";
import { WebviewBridge } from "./runtime/webviewBridge.js";

const CONFIG_ROOT = "pixelmate.companion";
const IDLE_THRESHOLD_MS = 60_000;
const ACTIVE_WINDOW_MS = 120_000;
const HYDRATION_INTERVAL_MS = 20 * 60_000;
const STAND_INTERVAL_MS = 60 * 60_000;

type HabitatBackground =
  | "livingRoom"
  | "outdoorGround"
  | "snowyMountains"
  | "greenMountains"
  | "officeDesk";

function isPersonalityId(value: unknown): value is CompanionSettings["personality"] {
  return (
    value === "calm" ||
    value === "curious" ||
    value === "playful" ||
    value === "focused" ||
    value === "cheerful"
  );
}

class WorkspacePersistence implements CompanionPersistence {
  public constructor(private readonly storage: vscode.Memento) {}

  public read<T>(key: string, fallback: T): T {
    return this.storage.get<T>(key, fallback);
  }

  public write<T>(key: string, value: T): void {
    void this.storage.update(key, value);
  }
}

export class RuntimeCompanionHost implements vscode.Disposable, vscode.WebviewViewProvider {
  private panel: vscode.WebviewPanel | undefined;
  private view: vscode.WebviewView | undefined;
  private timer: NodeJS.Timeout | undefined;
  private typingDebounceTimer: NodeJS.Timeout | undefined;
  private readonly kernel: PixelMateCompanionKernel;
  private readonly extensionUri: vscode.Uri;
  private readonly assetLoader = new AssetLoader();
  private readonly animationPlayer: AnimationPlayer;
  private readonly messageBus = new RuntimeMessageBus<
    RuntimeCommandPayload,
    RuntimeMessage["type"]
  >({
    name: "runtime-host-bus"
  });
  private readonly webviewBridge = new WebviewBridge();
  private readonly pendingMessages: RuntimeMessage<RuntimeCommandPayload>[] = [];
  private readonly timeline: Array<{
    timestamp: number;
    source: string;
    event: string;
    payload: unknown;
    durationMs: number;
  }> = [];
  private isReady = false;
  private currentMode: RuntimeMode = "default";
  private currentTheme = "default";
  private currentPersonality: CompanionSettings["personality"] = "calm";
  private demoSequence = ["wave", "celebrate", "observe", "idle"];
  private demoIndex = 0;
  private demoTimer: NodeJS.Timeout | undefined;
  private lastTickAt = Date.now();
  private lastActivityAt = Date.now();
  private lastRenderAt = Date.now();
  private currentBackground: HabitatBackground = "snowyMountains";
  private windowFocused = true;
  private activeCycleMs = 0;
  private nextHydrationReminderAt = HYDRATION_INTERVAL_MS;
  private readonly disposables: vscode.Disposable[] = [];

  public constructor(context: vscode.ExtensionContext) {
    this.extensionUri = context.extensionUri;
    this.assetLoader.loadManifest(createCompanionAssetManifest());
    const idleSprite = this.assetLoader.getSprite("idle");
    this.animationPlayer = new AnimationPlayer(
      createAnimationClip({
        id: "idle",
        name: "idle",
        frames: idleSprite?.frames ?? ["idle-1"],
        fps: 6,
        loop: true
      })
    );

    this.kernel = new PixelMateCompanionKernel({
      persistence: new WorkspacePersistence(context.workspaceState)
    });
    this.kernel.loadAssets();
    this.kernel.start();
    this.kernel.handleEvent({
      type: "workspaceLoaded",
      at: Date.now(),
      payload: {
        workspace: vscode.workspace.name ?? "workspace"
      }
    });
    this.kernel.handleEvent({
      type: "openFilesChanged",
      at: Date.now(),
      payload: {
        count: vscode.window.visibleTextEditors.length
      }
    });
    this.kernel.registerBehaviorPlugin({
      id: "focus-wave",
      onEvent: (eventType, state) => {
        if (eventType === "editorFocus" && state.editorFocused) {
          return "wave";
        }
        return undefined;
      }
    });

    this.applySettingsFromConfiguration();
    this.attachRuntimeEvents();
    this.attachMessageRouting();
    this.startTickLoop();
  }

  public show(): void {
    void vscode.commands.executeCommand("workbench.view.explorer");
    void vscode.commands.executeCommand("pixelmate.companionView.focus");
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    this.view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "assets")]
    };
    this.view.webview.html = this.getWebviewHtml(this.view.webview);
    this.view.webview.onDidReceiveMessage(
      (message) => {
        this.handleWebviewMessage(message);
      },
      undefined,
      this.disposables
    );
    this.view.onDidChangeVisibility(
      () => {
        if (this.view?.visible === true) {
          this.isReady = true;
          this.flushQueuedMessages();
          this.renderSnapshot(this.kernel.tick(0));
        }
      },
      undefined,
      this.disposables
    );

    this.isReady = true;
    this.flushQueuedMessages();
    this.renderSnapshot(this.kernel.tick(0));
  }

  public dispose(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    if (this.typingDebounceTimer !== undefined) {
      clearTimeout(this.typingDebounceTimer);
      this.typingDebounceTimer = undefined;
    }

    for (const disposable of this.disposables) {
      disposable.dispose();
    }

    this.clearDemoLoop();
    this.panel?.dispose();
    this.panel = undefined;
    this.view = undefined;
    this.pendingMessages.length = 0;
    this.kernel.handleEvent({ type: "workspaceClosed", at: Date.now() });
    this.kernel.stop();
    this.kernel.dispose();
  }

  public send(message: RuntimeMessage<RuntimeCommandPayload>): void {
    this.messageBus.publish(message);
  }

  public hide(): void {
    this.panel?.dispose();
  }

  public setMode(mode: RuntimeMode): void {
    this.currentMode = mode;
    this.clearDemoLoop();
    this.applyModeState(mode);
    const message = createRuntimeMessage(
      RUNTIME_MESSAGE_TYPES.SET_MODE,
      { mode },
      "vscode",
      "engine"
    );
    this.send(message);

    if (mode === "demo") {
      this.startDemoLoop();
    }
  }

  public playAnimation(animation: string): void {
    this.send(
      createRuntimeMessage(RUNTIME_MESSAGE_TYPES.PLAY_ANIMATION, { animation }, "vscode", "engine")
    );
  }

  public setTheme(theme: string): void {
    this.currentTheme = theme;
    this.send(createRuntimeMessage(RUNTIME_MESSAGE_TYPES.SET_THEME, { theme }, "vscode", "engine"));
  }

  public setPersonality(personality: CompanionSettings["personality"]): void {
    this.currentPersonality = personality;
    this.send(
      createRuntimeMessage(
        RUNTIME_MESSAGE_TYPES.SET_PERSONALITY,
        { personality },
        "vscode",
        "engine"
      )
    );
  }

  public freeze(): void {
    this.send(createRuntimeMessage(RUNTIME_MESSAGE_TYPES.FREEZE, {}, "vscode", "engine"));
  }

  public resume(): void {
    this.send(createRuntimeMessage(RUNTIME_MESSAGE_TYPES.RESUME, {}, "vscode", "engine"));
  }

  public capture(): void {
    this.send(
      createRuntimeMessage(RUNTIME_MESSAGE_TYPES.CAPTURE_SCREENSHOT, {}, "vscode", "engine")
    );
  }

  public spawn(): void {
    this.send(createRuntimeMessage(RUNTIME_MESSAGE_TYPES.LOAD_COMPANION, {}, "vscode", "engine"));
  }

  public destroy(): void {
    this.send(createRuntimeMessage(RUNTIME_MESSAGE_TYPES.HIDE_COMPANION, {}, "vscode", "engine"));
  }

  private attachMessageRouting(): void {
    this.messageBus.use((message, next) => {
      this.pendingMessages.push(message);
      if (this.isReady) {
        this.postToCompanion(createRuntimeEnvelope("event", message));
      }
      next();
    });

    this.messageBus.subscribe((message) => {
      const start = Date.now();
      this.recordTimeline(message.type, message.payload, start);
      this.handleRuntimeMessage(message);
      this.recordDuration(message.type, start);
    });

    this.webviewBridge.onMessage((message) => {
      const runtimeMessage = createRuntimeMessage(
        (message.type as RuntimeMessage<RuntimeCommandPayload>["type"]) ??
          RUNTIME_MESSAGE_TYPES.EVENT,
        (message.payload as RuntimeCommandPayload) ?? {},
        "webview",
        "runtime"
      );
      this.messageBus.publish(runtimeMessage);
    });
  }

  private attachRuntimeEvents(): void {
    this.disposables.push(
      vscode.window.onDidChangeWindowState((state) => {
        this.windowFocused = state.focused;
        this.handleActivity(state.focused ? "windowFocus" : "windowBlur");
      })
    );

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.handleActivity("editorChanged");
        this.emitOpenFileCount();
      })
    );

    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(() => {
        this.handleActivity("activity");
      })
    );

    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument(() => {
        this.handleActivity("activity");
      })
    );

    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(() => {
        this.handleActivity("typingStarted");

        if (this.typingDebounceTimer !== undefined) {
          clearTimeout(this.typingDebounceTimer);
        }

        this.typingDebounceTimer = setTimeout(() => {
          this.kernel.handleEvent({ type: "typingStopped", at: Date.now() });
        }, 1200);
      })
    );

    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(CONFIG_ROOT)) {
          this.applySettingsFromConfiguration();
          this.renderSnapshot(this.kernel.tick(0));
        }
      })
    );

    this.disposables.push(
      vscode.tasks.onDidStartTaskProcess(() => {
        this.kernel.handleEvent({ type: "buildStarted", at: Date.now() });
      })
    );

    this.disposables.push(
      vscode.tasks.onDidEndTaskProcess((event) => {
        this.kernel.handleEvent({
          type: event.exitCode === 0 ? "buildSuccess" : "buildError",
          at: Date.now()
        });
      })
    );

    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics(() => {
        const hasErrors = this.hasAnyErrors();
        this.kernel.handleEvent({
          type: hasErrors ? "diagnosticError" : "diagnosticClear",
          at: Date.now()
        });
      })
    );

    this.disposables.push(
      vscode.window.onDidChangeVisibleTextEditors(() => {
        this.emitOpenFileCount();
      })
    );
  }

  private startTickLoop(): void {
    this.timer = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - this.lastTickAt;
      this.lastTickAt = now;

      if (this.kernel.getSettings().autoSleep && now - this.lastActivityAt >= IDLE_THRESHOLD_MS) {
        this.kernel.handleEvent({ type: "idleTimeout", at: now });
        this.kernel.handleEvent({ type: "cursorIdle", at: now });
      }

      this.updateWellnessSession(deltaMs, now);

      if (this.panel === undefined && this.view === undefined) {
        return;
      }

      const snapshot = this.kernel.tick(deltaMs);
      this.renderSnapshot(snapshot);
    }, 220);
  }

  private updateWellnessSession(deltaMs: number, now: number): void {
    const config = vscode.workspace.getConfiguration(CONFIG_ROOT);
    const remindersEnabled = config.get<boolean>("wellnessReminders", true);
    const recentlyActive = now - this.lastActivityAt <= ACTIVE_WINDOW_MS;

    if (!remindersEnabled || !this.windowFocused || !recentlyActive) {
      return;
    }

    this.activeCycleMs += deltaMs;

    if (this.activeCycleMs >= STAND_INTERVAL_MS) {
      this.postWellnessMessage(
        "stand",
        "You’ve been coding for an hour. Stand up, stretch, or take a short walk 🚶"
      );
      this.activeCycleMs = 0;
      this.nextHydrationReminderAt = HYDRATION_INTERVAL_MS;
      return;
    }

    if (this.activeCycleMs >= this.nextHydrationReminderAt) {
      this.postWellnessMessage(
        "hydrate",
        "Hydration check 💧 Rest your eyes for a moment and grab some water."
      );
      this.nextHydrationReminderAt += HYDRATION_INTERVAL_MS;
    }
  }

  private postWellnessMessage(kind: "hydrate" | "stand", message: string): void {
    this.postToCompanion({
      type: "wellness",
      payload: {
        kind,
        message
      }
    });
  }

  private handleActivity(
    type:
      | "activity"
      | "editorFocus"
      | "editorBlur"
      | "editorChanged"
      | "typingStarted"
      | "windowFocus"
      | "windowBlur"
  ): void {
    this.lastActivityAt = Date.now();
    this.kernel.handleEvent({ type, at: this.lastActivityAt });
  }

  private emitOpenFileCount(): void {
    this.kernel.handleEvent({
      type: "openFilesChanged",
      at: Date.now(),
      payload: {
        count: vscode.window.visibleTextEditors.length
      }
    });
  }

  private applySettingsFromConfiguration(): void {
    const config = vscode.workspace.getConfiguration(CONFIG_ROOT);

    const nextSettings: Partial<CompanionSettings> = {
      companionType: config.get<CompanionSettings["companionType"]>(
        "type",
        DEFAULT_SETTINGS.companionType
      ),
      scale: config.get<number>("scale", DEFAULT_SETTINGS.scale),
      speed: config.get<number>("speed", DEFAULT_SETTINGS.speed),
      movementSpeed: config.get<number>("movementSpeed", DEFAULT_SETTINGS.movementSpeed),
      position: {
        x: config.get<number>("positionX", DEFAULT_SETTINGS.position.x),
        y: config.get<number>("positionY", DEFAULT_SETTINGS.position.y)
      },
      theme: config.get<string>("theme", DEFAULT_SETTINGS.theme),
      animationFrequency: config.get<number>(
        "animationFrequency",
        DEFAULT_SETTINGS.animationFrequency
      ),
      idleBehavior: config.get<"idle" | "observe">("idleBehavior", DEFAULT_SETTINGS.idleBehavior),
      personality: config.get<CompanionSettings["personality"]>(
        "personality",
        DEFAULT_SETTINGS.personality
      ),
      behaviorIntensity: config.get<number>(
        "behaviorIntensity",
        DEFAULT_SETTINGS.behaviorIntensity
      ),
      accessibilityMode: config.get<boolean>(
        "accessibilityMode",
        DEFAULT_SETTINGS.accessibilityMode
      ),
      focusMode: config.get<boolean>("focusMode", DEFAULT_SETTINGS.focusMode),
      reduceMotion: config.get<boolean>("reduceMotion", DEFAULT_SETTINGS.reduceMotion),
      debugMode: config.get<boolean>("debugMode", DEFAULT_SETTINGS.debugMode),
      speechEnabled: config.get<boolean>("speechEnabled", DEFAULT_SETTINGS.speechEnabled),
      autoSleep: config.get<boolean>("autoSleep", DEFAULT_SETTINGS.autoSleep)
    };

    this.kernel.updateSettings(nextSettings);
    this.currentBackground = config.get<HabitatBackground>("background", "snowyMountains");
  }

  private hasAnyErrors(): boolean {
    const diagnostics = vscode.languages.getDiagnostics();
    for (const [, entries] of diagnostics) {
      for (const entry of entries) {
        if (entry.severity === vscode.DiagnosticSeverity.Error) {
          return true;
        }
      }
    }
    return false;
  }

  private renderSnapshot(snapshot: CompanionSnapshot): void {
    if (this.panel === undefined && this.view === undefined) {
      return;
    }

    const now = Date.now();
    const deltaMs = Math.max(16, now - this.lastRenderAt);
    this.lastRenderAt = now;
    const animationState = this.animationPlayer.advance(deltaMs);
    const settings = this.kernel.getSettings();
    const renderFrame = buildRenderFrame({
      frame: snapshot.frame ?? animationState.frame,
      scale: settings.scale,
      theme: settings.theme,
      rotation: snapshot.behavior === "walk" ? -4 : 0,
      mirrored: snapshot.behavior === "walk"
    });

    this.postToCompanion({
      type: "snapshot",
      payload: {
        snapshot,
        settings,
        renderFrame,
        mode: this.currentMode,
        theme: this.currentTheme,
        personality: this.currentPersonality,
        habitatBackground: this.currentBackground,
        debug: this.currentMode === "design"
      }
    });
  }

  private handleRuntimeMessage(message: RuntimeMessage<RuntimeCommandPayload>): void {
    const payload = message.payload;
    switch (message.type) {
      case RUNTIME_MESSAGE_TYPES.SHOW_COMPANION:
        this.show();
        break;
      case RUNTIME_MESSAGE_TYPES.HIDE_COMPANION:
        this.hide();
        break;
      case RUNTIME_MESSAGE_TYPES.SET_MODE: {
        const mode = payload.mode ?? "default";
        this.currentMode = mode;
        this.clearDemoLoop();
        this.kernel.handleEvent({ type: "activity", at: Date.now(), payload: { mode } });
        this.applyModeState(mode);
        if (mode === "demo") {
          this.startDemoLoop();
        }
        this.postToCompanion(
          createRuntimeEnvelope(
            "event",
            createRuntimeMessage(RUNTIME_MESSAGE_TYPES.ACK, { mode }, "runtime", "webview")
          )
        );
        break;
      }
      case RUNTIME_MESSAGE_TYPES.PLAY_ANIMATION:
        this.kernel.handleEvent({
          type: "activity",
          at: Date.now(),
          payload: { animation: payload.animation ?? "idle" }
        });
        break;
      case RUNTIME_MESSAGE_TYPES.SET_THEME:
        this.currentTheme = payload.theme ?? this.currentTheme;
        this.kernel.updateSettings({ theme: this.currentTheme });
        break;
      case RUNTIME_MESSAGE_TYPES.SET_PERSONALITY:
        if (isPersonalityId(payload.personality)) {
          this.currentPersonality = payload.personality;
          this.kernel.updateSettings({
            personality: this.currentPersonality
          });
        }
        break;
      case RUNTIME_MESSAGE_TYPES.FREEZE:
        this.kernel.handleEvent({ type: "activity", at: Date.now(), payload: { frozen: true } });
        break;
      case RUNTIME_MESSAGE_TYPES.RESUME:
        this.kernel.handleEvent({ type: "activity", at: Date.now(), payload: { frozen: false } });
        break;
      case RUNTIME_MESSAGE_TYPES.CAPTURE_SCREENSHOT:
        this.postToCompanion(
          createRuntimeEnvelope(
            "event",
            createRuntimeMessage(
              RUNTIME_MESSAGE_TYPES.CAPTURE_SCREENSHOT,
              { ready: true },
              "runtime",
              "webview"
            )
          )
        );
        break;
      case RUNTIME_MESSAGE_TYPES.LOAD_COMPANION:
        this.kernel.handleEvent({
          type: "workspaceLoaded",
          at: Date.now(),
          payload: { companion: payload.companionId ?? "default" }
        });
        break;
      case RUNTIME_MESSAGE_TYPES.PING:
        this.postToCompanion(createRuntimeEnvelope("response", message));
        break;
      default:
        break;
    }
  }

  private handleWebviewMessage(message: unknown): void {
    const webviewMessage = message as {
      type?: string;
      payload?: RuntimeCommandPayload & {
        action?: string;
        companionType?: CompanionSettings["companionType"];
        background?: HabitatBackground;
      };
      requestId?: string;
    };
    if (webviewMessage.type === undefined) {
      return;
    }

    if (webviewMessage.type === "pixelmate.ui") {
      this.handleUiAction(webviewMessage.payload ?? {});
      return;
    }

    if (webviewMessage.requestId !== undefined) {
      this.webviewBridge.receive({
        type: webviewMessage.type,
        payload: webviewMessage.payload,
        requestId: webviewMessage.requestId
      });
      return;
    }

    this.webviewBridge.receive({ type: webviewMessage.type, payload: webviewMessage.payload });
  }

  private handleUiAction(
    payload: RuntimeCommandPayload & {
      action?: string;
      companionType?: CompanionSettings["companionType"];
      background?: HabitatBackground;
    }
  ): void {
    switch (payload.action) {
      case "setCompanion":
        if (payload.companionType !== undefined) {
          void vscode.workspace
            .getConfiguration(CONFIG_ROOT)
            .update("type", payload.companionType, vscode.ConfigurationTarget.Global);
        }
        break;
      case "setBackground":
        if (payload.background !== undefined) {
          this.currentBackground = payload.background;
          void vscode.workspace
            .getConfiguration(CONFIG_ROOT)
            .update("background", payload.background, vscode.ConfigurationTarget.Global);
          this.renderSnapshot(this.kernel.tick(0));
        }
        break;
      case "feed":
        this.kernel.handleEvent({ type: "activity", at: Date.now(), payload: { interaction: "feed" } });
        this.playAnimation("celebrate");
        break;
      case "nap":
        this.kernel.handleEvent({ type: "idleTimeout", at: Date.now(), payload: { interaction: "nap" } });
        break;
      case "throwBall":
        this.kernel.handleEvent({ type: "activity", at: Date.now(), payload: { interaction: "throwBall" } });
        this.playAnimation("walk");
        break;
      default:
        break;
    }
  }

  private applyModeState(mode: RuntimeMode): void {
    switch (mode) {
      case "design":
        this.kernel.updateSettings({
          debugMode: true,
          reduceMotion: false,
          accessibilityMode: false,
          focusMode: true,
          behaviorIntensity: 0.7,
          animationFrequency: 1.05,
          theme: "ocean",
          personality: "focused"
        });
        this.currentTheme = "ocean";
        this.currentPersonality = "focused";
        break;
      case "demo":
        this.kernel.updateSettings({
          debugMode: false,
          reduceMotion: false,
          accessibilityMode: false,
          focusMode: false,
          behaviorIntensity: 0.95,
          animationFrequency: 1.2,
          theme: "default",
          personality: "cheerful"
        });
        this.currentTheme = "default";
        this.currentPersonality = "cheerful";
        break;
      case "screenshot":
        this.kernel.updateSettings({
          debugMode: false,
          reduceMotion: true,
          accessibilityMode: true,
          focusMode: true,
          behaviorIntensity: 0.2,
          animationFrequency: 0.8,
          theme: "sunrise",
          personality: "calm"
        });
        this.currentTheme = "sunrise";
        this.currentPersonality = "calm";
        break;
      default:
        this.kernel.updateSettings({
          debugMode: false,
          reduceMotion: false,
          accessibilityMode: false,
          focusMode: false,
          behaviorIntensity: 0.55,
          animationFrequency: 1,
          theme: "default",
          personality: "calm"
        });
        this.currentTheme = "default";
        this.currentPersonality = "calm";
        break;
    }
  }

  private startDemoLoop(): void {
    this.clearDemoLoop();
    this.demoTimer = setInterval(() => {
      if (this.currentMode !== "demo") {
        return;
      }
      const step = this.demoSequence[this.demoIndex % this.demoSequence.length];
      this.demoIndex += 1;
      if (step !== undefined) {
        this.playAnimation(step);
      }
    }, 3500);
  }

  private clearDemoLoop(): void {
    if (this.demoTimer !== undefined) {
      clearInterval(this.demoTimer);
      this.demoTimer = undefined;
    }
  }

  private flushQueuedMessages(): void {
    if (this.panel === undefined && this.view === undefined) {
      return;
    }

    this.isReady = true;
    while (this.pendingMessages.length > 0) {
      const queued = this.pendingMessages.shift();
      if (queued !== undefined) {
        this.postToCompanion(createRuntimeEnvelope("event", queued));
      }
    }
  }

  private postToCompanion(message: unknown): void {
    void this.panel?.webview.postMessage(message);
    void this.view?.webview.postMessage(message);
  }

  private recordTimeline(event: string, payload: unknown, startedAt: number): void {
    this.timeline.push({
      timestamp: startedAt,
      source: "runtime-host",
      event,
      payload,
      durationMs: 0
    });
  }

  private recordDuration(event: string, startedAt: number): void {
    const last = this.timeline[this.timeline.length - 1];
    if (last !== undefined) {
      last.durationMs = Date.now() - startedAt;
      last.event = event;
    }
  }

  private getWebviewHtml(webview: vscode.Webview): string {
    const habitatUris = {
      livingRoom: webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, "assets", "habitats", "living-room.svg")
      ).toString(),
      outdoorGround: webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, "assets", "habitats", "outdoor-ground.svg")
      ).toString(),
      snowyMountains: webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, "assets", "habitats", "snowy-mountains.svg")
      ).toString(),
      greenMountains: webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, "assets", "habitats", "green-mountains.svg")
      ).toString(),
      officeDesk: webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, "assets", "habitats", "office-desk.svg")
      ).toString()
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PixelMate</title>
  <style>
    :root {
      color-scheme: dark;
      --panel: rgba(15, 23, 42, .92);
      --panel-border: rgba(148, 163, 184, .18);
      --text: var(--vscode-foreground, #e6edf7);
      --muted: var(--vscode-descriptionForeground, #9aa7b8);
      --accent: #3b82f6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 8px;
      color: var(--text);
      background: transparent;
      font-family: var(--vscode-font-family, "Segoe UI", sans-serif);
      font-size: 12px;
    }
    button { font: inherit; }
    .shell { display: grid; gap: 8px; min-width: 210px; }
    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; padding: 2px 2px 4px;
    }
    .brand { display: flex; align-items: center; gap: 7px; min-width: 0; font-weight: 700; }
    .brand-mark {
      width: 22px; height: 22px; display: grid; place-items: center;
      border-radius: 7px; background: linear-gradient(135deg,#2563eb,#06b6d4);
      box-shadow: 0 5px 14px rgba(37,99,235,.26);
    }
    .status-chip {
      display: flex; align-items: center; gap: 5px; border-radius: 999px;
      padding: 4px 8px; background: rgba(15,23,42,.7);
      border: 1px solid var(--panel-border); color: #86efac; white-space: nowrap;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; }

    .habitat {
      position: relative; height: 228px; border-radius: 12px; overflow: hidden;
      border: 1px solid rgba(96,165,250,.42);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.03), 0 9px 24px rgba(0,0,0,.18);
      background: #10253d;
    }
    .world {
      position: absolute;
      inset: 0 auto 0 -22%;
      width: 144%;
      height: 100%;
      transform: translateX(0) scale(1.025);
      transform-origin: 50% 70%;
      transition: transform 1000ms cubic-bezier(.22,.8,.22,1), filter 300ms ease;
      background-size: cover;
      background-position: center bottom;
      background-repeat: no-repeat;
      will-change: transform;
    }
    .world::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,.08) 43%, transparent 63%);
      transform: translateX(-120%);
      animation: sceneLight 13s ease-in-out infinite;
      mix-blend-mode: screen;
    }
    .world::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(180deg, rgba(6,18,35,.03), transparent 45%, rgba(3,10,20,.12));
    }
    .theme-livingRoom { background-image: url("${habitatUris.livingRoom}"); }
    .theme-outdoorGround { background-image: url("${habitatUris.outdoorGround}"); }
    .theme-snowyMountains { background-image: url("${habitatUris.snowyMountains}"); }
    .theme-greenMountains { background-image: url("${habitatUris.greenMountains}"); }
    .theme-officeDesk { background-image: url("${habitatUris.officeDesk}"); }
    @keyframes sceneLight {
      0%, 58% { transform: translateX(-120%); opacity: 0; }
      68% { opacity: .45; }
      86% { transform: translateX(120%); opacity: .15; }
      100% { transform: translateX(120%); opacity: 0; }
    }
    .habitat-vignette {
      position:absolute; inset:0; pointer-events:none;
      background: linear-gradient(180deg,rgba(0,0,0,.08),transparent 32%,rgba(0,0,0,.18));
      box-shadow: inset 0 0 36px rgba(3,10,22,.3);
    }
    .ground-shadow {
      position:absolute; width:54px; height:11px; bottom:21px; left:50%;
      transform:translateX(-50%); border-radius:50%;
      background:rgba(0,0,0,.25); filter:blur(3px); transition:left 900ms ease;
    }
    .companion {
      position:absolute; width:70px; height:70px; left:42%; bottom:22px;
      display:grid; place-items:center; transform:translateX(-50%);
      transition:left 900ms cubic-bezier(.25,.8,.25,1), bottom 700ms cubic-bezier(.25,.8,.25,1);
      z-index:4; user-select:none; will-change:left,bottom;
    }
    .sprite {
      font-size:52px; line-height:1; transform-origin:50% 85%;
      filter:drop-shadow(0 8px 6px rgba(0,0,0,.28));
      animation: idleBob 2.2s ease-in-out infinite;
    }
    .companion.moving .sprite { animation: walk .36s ease-in-out infinite; }
    .companion.excited .sprite { animation: excited .46s ease-in-out 3; }
    .companion.sleeping .sprite { animation: breathe 2.2s ease-in-out infinite; filter:grayscale(.08) drop-shadow(0 7px 6px rgba(0,0,0,.25)); }
    .companion.micro-look .sprite { animation: lookAround 1.15s ease-in-out 1; }
    .companion.micro-stretch .sprite { animation: stretch 1.05s ease-in-out 1; }
    .companion.micro-bounce .sprite { animation: tinyBounce .7s ease-in-out 2; }
    .companion.zoomies .sprite { animation: zoomies .24s ease-in-out infinite; }
    .companion.flip .sprite { transform:scaleX(-1); }
    .companion.flip.moving .sprite,
    .companion.flip.zoomies .sprite { animation-name: walkFlip; }
    @keyframes idleBob { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-3px) rotate(.8deg)} }
    @keyframes walk { 0%,100%{transform:translateY(0) rotate(-3deg) scaleY(1)} 50%{transform:translateY(-6px) rotate(3deg) scaleY(.96)} }
    @keyframes walkFlip { 0%,100%{transform:scaleX(-1) translateY(0) rotate(-3deg)} 50%{transform:scaleX(-1) translateY(-6px) rotate(3deg)} }
    @keyframes excited { 0%,100%{transform:translateY(0) scale(1)} 38%{transform:translateY(-13px) scale(1.1,.94)} 68%{transform:translateY(1px) scale(.96,1.06)} }
    @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04,.96)} }
    @keyframes lookAround { 0%,100%{transform:translateX(0) rotate(0)} 30%{transform:translateX(-4px) rotate(-7deg)} 65%{transform:translateX(4px) rotate(7deg)} }
    @keyframes stretch { 0%,100%{transform:scale(1)} 45%{transform:scaleX(1.12) scaleY(.88) translateY(3px)} }
    @keyframes tinyBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes zoomies { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-7px) rotate(4deg)} }
    .ball {
      position:absolute; width:18px; height:18px; border-radius:50%; bottom:29px; left:72%;
      z-index:3; opacity:0; transform:scale(.3);
      background:radial-gradient(circle at 35% 30%,#fff 0 8%,#fb7185 9% 28%,#ef4444 29% 62%,#991b1b 63%);
      box-shadow:0 5px 8px rgba(0,0,0,.35);
      transition:left 450ms cubic-bezier(.2,.8,.2,1),opacity 150ms,transform 240ms;
    }
    .ball.visible { opacity:1; transform:scale(1); }
    .speech {
      position:absolute; z-index:8; left:50%; top:18px; transform:translateX(-50%) translateY(4px);
      width:max-content; max-width:86%; padding:7px 10px; border-radius:10px 10px 10px 3px;
      color:#172033; background:rgba(255,255,255,.96); box-shadow:0 7px 18px rgba(0,0,0,.18);
      font-weight:600; line-height:1.35; opacity:0; transition:opacity 160ms,transform 160ms;
      pointer-events:none; text-align:center;
    }
    .speech.visible { opacity:1; transform:translateX(-50%) translateY(0); }
    .habitat-badge {
      position:absolute; top:8px; left:8px; z-index:7; display:flex; align-items:center; gap:5px;
      padding:4px 7px; border-radius:8px; background:rgba(4,15,28,.58);
      backdrop-filter:blur(5px); border:1px solid rgba(255,255,255,.12); font-size:11px;
    }
    .actions { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:5px; }
    .action {
      min-width:0; height:38px; padding:4px 2px; border-radius:8px; border:1px solid var(--panel-border);
      color:var(--text); background:rgba(30,41,59,.72); cursor:pointer;
      display:grid; place-items:center; gap:0; transition:transform 120ms,border-color 120ms,background 120ms;
    }
    .action:hover { border-color:rgba(96,165,250,.65); background:rgba(37,99,235,.16); }
    .action:active { transform:scale(.96); }
    .action .icon { font-size:15px; }
    .action .label { font-size:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%; }
    .action.primary { background:linear-gradient(135deg,#2563eb,#0ea5e9); border-color:#60a5fa; }

    .design {
      overflow:hidden; border:1px solid var(--panel-border); border-radius:10px;
      background:rgba(15,23,42,.58);
    }
    .design-toggle {
      width:100%; border:0; color:var(--text); background:transparent; cursor:pointer;
      padding:9px 10px; display:flex; align-items:center; justify-content:space-between; font-weight:700;
    }
    .chevron { transition:transform 180ms; }
    .design.open .chevron { transform:rotate(180deg); }
    .design-content { max-height:0; opacity:0; overflow:hidden; transition:max-height 260ms ease,opacity 180ms ease; }
    .design.open .design-content { max-height:360px; opacity:1; }
    .design-inner { padding:0 9px 10px; display:grid; gap:10px; }
    .section-label { color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.06em; margin-bottom:5px; }
    .choices { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:5px; }
    .choice {
      position:relative; min-width:0; border-radius:8px; border:1px solid var(--panel-border);
      background:rgba(30,41,59,.7); color:var(--text); padding:6px 3px; cursor:pointer; text-align:center;
    }
    .choice.selected { border-color:#60a5fa; box-shadow:inset 0 0 0 1px #2563eb; background:rgba(37,99,235,.16); }
    .choice .preview { display:block; font-size:24px; margin-bottom:2px; }
    .choice .name { font-size:9px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block; }
    .backgrounds { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .background-choice { padding:0; overflow:hidden; text-align:left; }
    .background-thumb { display:block; height:38px; }
    .background-name { display:block; padding:5px 6px; font-size:9px; }
    .background-thumb { background-size:cover; background-position:center; }
    .bg-livingRoom { background-image:url("${habitatUris.livingRoom}"); }
    .bg-outdoorGround { background-image:url("${habitatUris.outdoorGround}"); }
    .bg-snowyMountains { background-image:url("${habitatUris.snowyMountains}"); }
    .bg-greenMountains { background-image:url("${habitatUris.greenMountains}"); }
    .bg-officeDesk { background-image:url("${habitatUris.officeDesk}"); }
    .footnote { color:var(--muted); font-size:9px; line-height:1.35; text-align:center; padding:1px 6px 3px; }
    @media (prefers-reduced-motion: reduce) {
      .world,.companion,.ground-shadow,.sprite,.ball { animation:none!important; transition:none!important; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <div class="topbar">
      <div class="brand"><span class="brand-mark">🐾</span><span>PixelMate</span></div>
      <div id="statusChip" class="status-chip"><span class="status-dot"></span><span id="statusText">Happy</span></div>
    </div>

    <section id="habitat" class="habitat">
      <div id="world" class="world theme-snowyMountains"></div>
      <div class="habitat-vignette"></div>
      <div class="habitat-badge"><span id="habitatCompanion">🐶</span><span id="habitatLabel">Dog · Snowy Mountains</span></div>
      <div id="speech" class="speech"></div>
      <div id="ball" class="ball"></div>
      <div id="shadow" class="ground-shadow"></div>
      <div id="companion" class="companion">
        <div id="sprite" class="sprite" aria-label="PixelMate companion">🐶</div>
      </div>
    </section>

    <div class="actions">
      <button id="throwBall" class="action primary" title="Throw a ball"><span class="icon">⚾</span><span class="label">Ball</span></button>
      <button id="feed" class="action" title="Feed PixelMate"><span class="icon">🥣</span><span class="label">Feed</span></button>
      <button id="nap" class="action" title="Let PixelMate nap"><span class="icon">🌙</span><span class="label">Nap</span></button>
      <button id="designAction" class="action" title="Open Design Mode"><span class="icon">🎨</span><span class="label">Design</span></button>
    </div>

    <section id="design" class="design">
      <button id="designToggle" class="design-toggle"><span>🎨 Design Mode</span><span class="chevron">⌄</span></button>
      <div class="design-content">
        <div class="design-inner">
          <div>
            <div class="section-label">Companion</div>
            <div id="companionChoices" class="choices">
              <button class="choice" data-companion="dog"><span class="preview">🐶</span><span class="name">Dog</span></button>
              <button class="choice" data-companion="cat"><span class="preview">🐱</span><span class="name">Cat</span></button>
              <button class="choice" data-companion="horse"><span class="preview">🐴</span><span class="name">Horse</span></button>
              <button class="choice" data-companion="smiley"><span class="preview">🙂</span><span class="name">Smiley</span></button>
            </div>
          </div>
          <div>
            <div class="section-label">Background Theme</div>
            <div id="backgroundChoices" class="choices backgrounds">
              <button class="choice background-choice" data-background="livingRoom"><span class="background-thumb bg-livingRoom"></span><span class="background-name">Living Room</span></button>
              <button class="choice background-choice" data-background="outdoorGround"><span class="background-thumb bg-outdoorGround"></span><span class="background-name">Outdoor Ground</span></button>
              <button class="choice background-choice" data-background="snowyMountains"><span class="background-thumb bg-snowyMountains"></span><span class="background-name">Snowy Mountains</span></button>
              <button class="choice background-choice" data-background="greenMountains"><span class="background-thumb bg-greenMountains"></span><span class="background-name">Green Mountains</span></button>
              <button class="choice background-choice" data-background="officeDesk"><span class="background-thumb bg-officeDesk"></span><span class="background-name">Office Desk</span></button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div class="footnote">Wellness reminders appear gently inside the habitat while you code.</div>
  </main>

  <script>
    const vscode = acquireVsCodeApi();
    const companion = document.getElementById("companion");
    const sprite = document.getElementById("sprite");
    const shadow = document.getElementById("shadow");
    const world = document.getElementById("world");
    const ball = document.getElementById("ball");
    const speech = document.getElementById("speech");
    const statusText = document.getElementById("statusText");
    const design = document.getElementById("design");
    const designToggle = document.getElementById("designToggle");
    const designAction = document.getElementById("designAction");
    const habitatCompanion = document.getElementById("habitatCompanion");
    const habitatLabel = document.getElementById("habitatLabel");

    const glyphs = { smiley: "🙂", cat: "🐱", dog: "🐶", horse: "🐴" };
    const companionNames = { smiley: "Smiley", cat: "Cat", dog: "Dog", horse: "Horse" };
    const backgroundNames = {
      livingRoom: "Living Room",
      outdoorGround: "Outdoor Ground",
      snowyMountains: "Snowy Mountains",
      greenMountains: "Green Mountains",
      officeDesk: "Office Desk"
    };
    const backgroundClasses = Object.keys(backgroundNames).map((key) => "theme-" + key);

    let currentCompanion = "dog";
    let currentBackground = "snowyMountains";
    let currentX = 0.42;
    let currentBottom = 22;
    let destinationX = currentX;
    let locomotionTimer;
    let wanderTimer;
    let microTimer;
    let speechTimer;
    let sleeping = false;
    let busyUntil = 0;
    let latestSettings = { speechEnabled: true, reduceMotion: false };

    function post(action, extras) {
      vscode.postMessage({
        type: "pixelmate.ui",
        payload: Object.assign({ action }, extras || {})
      });
    }

    function say(message, duration) {
      if (!latestSettings.speechEnabled || !message) return;
      speech.textContent = message;
      speech.classList.add("visible");
      clearTimeout(speechTimer);
      speechTimer = setTimeout(() => speech.classList.remove("visible"), duration || 4200);
    }

    function setStatus(text) {
      statusText.textContent = text;
    }

    function setBackground(background) {
      currentBackground = backgroundNames[background] ? background : "snowyMountains";
      world.classList.remove(...backgroundClasses);
      world.classList.add("theme-" + currentBackground);
      updateLabel();
      document.querySelectorAll("[data-background]").forEach((item) => {
        item.classList.toggle("selected", item.dataset.background === currentBackground);
      });
    }

    function setCompanion(type) {
      currentCompanion = glyphs[type] ? type : "smiley";
      sprite.textContent = glyphs[currentCompanion];
      habitatCompanion.textContent = glyphs[currentCompanion];
      sprite.setAttribute("aria-label", "PixelMate " + companionNames[currentCompanion]);
      companion.dataset.kind = currentCompanion;
      updateLabel();
      document.querySelectorAll("[data-companion]").forEach((item) => {
        item.classList.toggle("selected", item.dataset.companion === currentCompanion);
      });
    }

    function updateLabel() {
      habitatLabel.textContent = companionNames[currentCompanion] + " · " + backgroundNames[currentBackground];
    }

    function updateWorldPan(position) {
      const x = typeof position === "number" ? position : currentX;
      const normalized = (x - 0.5) / 0.5;
      const pan = Math.max(-11, Math.min(11, normalized * -11));
      world.style.transform = "translateX(" + pan + "%) scale(1.025)";
    }

    function clearMicroMotion() {
      companion.classList.remove("micro-look", "micro-stretch", "micro-bounce", "zoomies");
    }

    function walkTo(target, onArrive, fast) {
      if (sleeping) return;
      target = Math.max(0.14, Math.min(0.86, target));
      const distance = Math.abs(target - currentX);
      if (distance < 0.025) {
        if (onArrive) onArrive();
        return;
      }

      clearMicroMotion();
      companion.classList.remove("excited", "sleeping");
      companion.classList.add(fast ? "zoomies" : "moving");
      companion.classList.toggle("flip", target < currentX);
      setStatus(fast ? "Zooming" : "Exploring");
      destinationX = target;

      const nextBottom = 18 + Math.round(Math.random() * 16);
      currentBottom = nextBottom;
      companion.style.left = (target * 100) + "%";
      companion.style.bottom = nextBottom + "px";
      shadow.style.left = (target * 100) + "%";
      updateWorldPan(target);

      const duration = fast
        ? Math.max(320, Math.min(850, 320 + distance * 650))
        : Math.max(650, Math.min(1650, 650 + distance * 1350));
      companion.style.transitionDuration = duration + "ms";
      shadow.style.transitionDuration = duration + "ms";
      clearTimeout(locomotionTimer);
      locomotionTimer = setTimeout(() => {
        currentX = destinationX;
        companion.classList.remove("moving", "zoomies");
        setStatus("Happy");
        if (onArrive) onArrive();
      }, duration + 40);
    }

    function playMicroAnimation() {
      if (sleeping || Date.now() < busyUntil || companion.classList.contains("moving") || companion.classList.contains("zoomies")) {
        return;
      }
      clearMicroMotion();
      const motions = ["micro-look", "micro-stretch", "micro-bounce"];
      const motion = motions[Math.floor(Math.random() * motions.length)];
      companion.classList.add(motion);
      clearTimeout(microTimer);
      microTimer = setTimeout(() => companion.classList.remove(motion), 1450);
    }

    function scheduleWander() {
      clearTimeout(wanderTimer);
      const delay = 1800 + Math.random() * 2600;
      wanderTimer = setTimeout(() => {
        if (!sleeping && Date.now() >= busyUntil) {
          const roll = Math.random();
          if (roll < 0.68) {
            walkTo(0.15 + Math.random() * 0.7, undefined, Math.random() < 0.16);
          } else {
            playMicroAnimation();
          }
        }
        scheduleWander();
      }, delay);
    }

    function throwBall() {
      sleeping = false;
      companion.classList.remove("sleeping");
      const target = 0.2 + Math.random() * 0.62;
      ball.style.left = (target * 100) + "%";
      ball.classList.add("visible");
      busyUntil = Date.now() + 4000;
      setStatus("Chasing");
      say("Ball! 🐾", 1800);
      post("throwBall");
      setTimeout(() => {
        walkTo(target, () => {
          ball.classList.remove("visible");
          clearMicroMotion();
          companion.classList.add("excited");
          setStatus("Excited");
          say("Got it! 🎉", 2200);
          setTimeout(() => companion.classList.remove("excited"), 1500);
        });
      }, 420);
    }

    function feed() {
      sleeping = false;
      companion.classList.remove("sleeping");
      companion.classList.add("excited");
      setStatus("Happy");
      say("Yum! Thank you 🥣", 2400);
      post("feed");
      setTimeout(() => companion.classList.remove("excited"), 1500);
    }

    function nap() {
      sleeping = true;
      clearTimeout(locomotionTimer);
      companion.classList.remove("moving", "excited");
      companion.classList.add("sleeping");
      setStatus("Sleeping");
      say("Tiny nap… zzz 💤", 2300);
      post("nap");
    }

    function toggleDesign() {
      design.classList.toggle("open");
    }

    document.getElementById("throwBall").addEventListener("click", throwBall);
    document.getElementById("feed").addEventListener("click", feed);
    document.getElementById("nap").addEventListener("click", nap);
    designToggle.addEventListener("click", toggleDesign);
    designAction.addEventListener("click", () => {
      design.classList.add("open");
      design.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    document.querySelectorAll("[data-companion]").forEach((item) => {
      item.addEventListener("click", () => {
        const type = item.dataset.companion;
        setCompanion(type);
        post("setCompanion", { companionType: type });
        companion.classList.add("excited");
        setTimeout(() => companion.classList.remove("excited"), 1000);
      });
    });

    document.querySelectorAll("[data-background]").forEach((item) => {
      item.addEventListener("click", () => {
        const background = item.dataset.background;
        setBackground(background);
        post("setBackground", { background });
      });
    });

    scheduleWander();
    setTimeout(() => {
      if (!sleeping) {
        walkTo(0.66, undefined, false);
      }
    }, 950);

    window.addEventListener("message", (event) => {
      if (!event.data) return;

      if (event.data.type === "wellness") {
        const payload = event.data.payload || {};
        sleeping = false;
        companion.classList.remove("sleeping");
        setStatus(payload.kind === "stand" ? "Break time" : "Hydrate");
        say(payload.message, 7600);
        return;
      }

      if (event.data.type !== "snapshot") return;
      const payload = event.data.payload || {};
      const snapshot = payload.snapshot || {};
      const settings = payload.settings || {};
      latestSettings = settings;
      setCompanion(settings.companionType || currentCompanion);
      setBackground(payload.habitatBackground || currentBackground);

      if (settings.reduceMotion) {
        companion.style.transitionDuration = "0ms";
        world.style.transitionDuration = "0ms";
      }

      if (!sleeping && snapshot.lifecycle === "sleeping") {
        companion.classList.add("sleeping");
        setStatus("Sleeping");
      } else if (!sleeping && snapshot.behavior === "celebrate") {
        companion.classList.add("excited");
        setStatus("Excited");
        setTimeout(() => companion.classList.remove("excited"), 1200);
      }

      if (payload.mode === "demo" && !sleeping) {
        companion.classList.add("excited");
      }
    });

    setCompanion(currentCompanion);
    setBackground(currentBackground);
    updateWorldPan(currentX);
    setTimeout(() => say("Ready to code? ✨", 2600), 650);
  </script>
</body>
</html>`;
  }
}
