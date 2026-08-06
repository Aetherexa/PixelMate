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

class WorkspacePersistence implements CompanionPersistence {
  public constructor(private readonly storage: vscode.Memento) {}

  public read<T>(key: string, fallback: T): T {
    return this.storage.get<T>(key, fallback);
  }

  public write<T>(key: string, value: T): void {
    void this.storage.update(key, value);
  }
}

export class RuntimeCompanionHost implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private timer: NodeJS.Timeout | undefined;
  private typingDebounceTimer: NodeJS.Timeout | undefined;
  private readonly kernel: PixelMateCompanionKernel;
  private readonly assetLoader = new AssetLoader();
  private readonly animationPlayer: AnimationPlayer;
  private readonly messageBus = new RuntimeMessageBus<RuntimeCommandPayload>({
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
  private currentPersonality = "calm";
  private demoSequence = ["wave", "celebrate", "observe", "idle"];
  private demoIndex = 0;
  private demoTimer: NodeJS.Timeout | undefined;
  private lastTickAt = Date.now();
  private lastActivityAt = Date.now();
  private lastRenderAt = Date.now();
  private readonly disposables: vscode.Disposable[] = [];

  public constructor(context: vscode.ExtensionContext) {
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
    this.show();
    this.startTickLoop();
  }

  public show(): void {
    if (this.panel !== undefined) {
      this.panel.reveal(vscode.ViewColumn.Beside, true);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "pixelmate.referenceCompanion",
      "PixelMate Companion",
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    this.panel.webview.html = this.getWebviewHtml();
    this.panel.webview.onDidReceiveMessage(
      (message) => {
        this.handleWebviewMessage(message);
      },
      undefined,
      this.disposables
    );
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.isReady = false;
      },
      undefined,
      this.disposables
    );

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

  public setPersonality(personality: string): void {
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
      if (this.isReady && this.panel !== undefined) {
        this.panel.webview.postMessage(createRuntimeEnvelope("event", message));
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

      if (now - this.lastActivityAt >= IDLE_THRESHOLD_MS) {
        this.kernel.handleEvent({ type: "idleTimeout", at: now });
        this.kernel.handleEvent({ type: "cursorIdle", at: now });
      }

      if (this.panel === undefined) {
        return;
      }

      const snapshot = this.kernel.tick(deltaMs);
      this.renderSnapshot(snapshot);
    }, 220);
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
      debugMode: config.get<boolean>("debugMode", DEFAULT_SETTINGS.debugMode)
    };

    this.kernel.updateSettings(nextSettings);
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
    if (this.panel === undefined) {
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

    this.panel.webview.postMessage({
      type: "snapshot",
      payload: {
        snapshot,
        settings,
        renderFrame,
        mode: this.currentMode,
        theme: this.currentTheme,
        personality: this.currentPersonality,
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
        this.panel?.webview.postMessage(
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
        this.currentPersonality = payload.personality ?? this.currentPersonality;
        this.kernel.updateSettings({
          personality: this.currentPersonality
        });
        break;
      case RUNTIME_MESSAGE_TYPES.FREEZE:
        this.kernel.handleEvent({ type: "activity", at: Date.now(), payload: { frozen: true } });
        break;
      case RUNTIME_MESSAGE_TYPES.RESUME:
        this.kernel.handleEvent({ type: "activity", at: Date.now(), payload: { frozen: false } });
        break;
      case RUNTIME_MESSAGE_TYPES.CAPTURE_SCREENSHOT:
        this.panel?.webview.postMessage(
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
        this.panel?.webview.postMessage(createRuntimeEnvelope("response", message));
        break;
      default:
        break;
    }
  }

  private handleWebviewMessage(message: unknown): void {
    const webviewMessage = message as {
      type?: string;
      payload?: RuntimeCommandPayload;
      requestId?: string;
    };
    if (webviewMessage.type === undefined) {
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
      this.playAnimation(step);
    }, 3500);
  }

  private clearDemoLoop(): void {
    if (this.demoTimer !== undefined) {
      clearInterval(this.demoTimer);
      this.demoTimer = undefined;
    }
  }

  private flushQueuedMessages(): void {
    if (this.panel === undefined) {
      return;
    }

    this.isReady = true;
    while (this.pendingMessages.length > 0) {
      const queued = this.pendingMessages.shift();
      if (queued !== undefined) {
        this.panel.webview.postMessage(createRuntimeEnvelope("event", queued));
      }
    }
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

  private getWebviewHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PixelMate Companion</title>
    <style>
      :root {
        --bg: #0e2439;
        --accent: #00b4d8;
      }
      body {
        margin: 0;
        padding: 0;
        background: radial-gradient(circle at top right, #16425b 0%, var(--bg) 65%);
        color: #e8f6ff;
        font-family: "Segoe UI", system-ui, sans-serif;
      }
      .stage {
        width: 100vw;
        height: 100vh;
        position: relative;
        overflow: hidden;
      }
      .companion {
        position: absolute;
        width: 120px;
        height: 120px;
        border-radius: 22px;
        background: linear-gradient(145deg, #1b4965, #00b4d8);
        display: grid;
        place-items: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        transition: transform 160ms ease;
      }
      .sprite {
        font-weight: 700;
        letter-spacing: 0.04em;
        font-size: 12px;
        color: #022b3a;
        text-transform: uppercase;
      }
      .hud {
        position: absolute;
        left: 12px;
        top: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(3, 19, 29, 0.72);
        backdrop-filter: blur(4px);
        font-size: 12px;
        line-height: 1.5;
      }
      .hud strong {
        color: #8de4ff;
      }
      .tiny {
        opacity: 0.8;
      }
      .panel {
        position: absolute;
        right: 12px;
        top: 12px;
        width: min(320px, 34vw);
        max-height: 48vh;
        overflow: auto;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(3, 19, 29, 0.72);
        backdrop-filter: blur(4px);
        font-size: 12px;
        line-height: 1.45;
      }
      button {
        margin-top: 6px;
        border: none;
        border-radius: 6px;
        padding: 6px 8px;
        background: var(--accent);
        color: #062130;
        cursor: pointer;
        font-weight: 700;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="stage">
      <div class="hud">
        <div><strong>PixelMate Core</strong></div>
        <div id="intent">Intent: observe</div>
        <div id="behavior">Behavior: idle</div>
        <div id="lifecycle">Lifecycle: running</div>
        <div id="personality">Personality: calm</div>
        <div id="needs" class="tiny">Needs: E70 C56 F48</div>
        <div id="theme">Theme: default</div>
        <div id="cpu" class="tiny">CPU hint: low</div>
        <div id="perf" class="tiny">FPS: 0 | Frame: 0.00ms</div>
        <div id="events" class="tiny">Events: 0</div>
      </div>
      <div class="panel">
        <div><strong>Runtime Debug</strong></div>
        <div id="mode">Mode: default</div>
        <div id="queue">Queue: 0</div>
        <div id="lastEvent">Last event: none</div>
        <div id="timeline">Timeline: []</div>
        <button id="exportButton">Export JSON</button>
      </div>
      <div id="companion" class="companion">
        <div id="sprite" class="sprite">idle-1</div>
      </div>
    </div>
    <script>
      const companion = document.getElementById("companion");
      const sprite = document.getElementById("sprite");
      const intent = document.getElementById("intent");
      const behavior = document.getElementById("behavior");
      const lifecycle = document.getElementById("lifecycle");
      const personality = document.getElementById("personality");
      const needs = document.getElementById("needs");
      const theme = document.getElementById("theme");
      const cpu = document.getElementById("cpu");
      const perf = document.getElementById("perf");
      const events = document.getElementById("events");
      const mode = document.getElementById("mode");
      const queue = document.getElementById("queue");
      const lastEvent = document.getElementById("lastEvent");
      const timeline = document.getElementById("timeline");
      const exportButton = document.getElementById("exportButton");
      const hud = document.querySelector(".hud");
      const debugPanel = document.querySelector(".panel");
      const stage = document.querySelector(".stage");
      const timelineEntries = [];

      const themes = {
        default: { bg: "#0e2439", accent: "#00b4d8" },
        ocean: { bg: "#12324a", accent: "#4fd1c5" },
        sunrise: { bg: "#3a2c2c", accent: "#ff9e6d" }
      };

      window.addEventListener("message", (event) => {
        if (!event.data || event.data.type !== "snapshot") {
          return;
        }

        const { snapshot, settings, renderFrame, mode: runtimeMode, theme: runtimeTheme, personality: runtimePersonality, debug } = event.data.payload;
        sprite.textContent = renderFrame.label;
        intent.textContent = "Intent: " + snapshot.intent;
        behavior.textContent = "Behavior: " + snapshot.behavior;
        lifecycle.textContent = "Lifecycle: " + snapshot.lifecycle;
        personality.textContent = "Personality: " + snapshot.personality;
        needs.textContent = "Needs: E" + Math.round(snapshot.needs.energy) + " C" + Math.round(snapshot.needs.curiosity) + " F" + Math.round(snapshot.needs.focus);
        theme.textContent = "Theme: " + settings.theme;
        cpu.textContent = "CPU hint: " + snapshot.metrics.idleCpuHint;
        perf.textContent = "FPS: " + snapshot.metrics.fps.toFixed(1) + " | Frame: " + snapshot.metrics.frameTimeMs.toFixed(2) + "ms";
        events.textContent = "Events: " + snapshot.metrics.eventsProcessed;

        const showDebug = Boolean(settings.debugMode || debug || runtimeMode === "design");
        needs.style.display = showDebug ? "block" : "none";
        perf.style.display = showDebug ? "block" : "none";
        events.style.display = showDebug ? "block" : "none";
        if (hud) hud.style.display = runtimeMode === "screenshot" ? "none" : "block";
        if (debugPanel) debugPanel.style.display = runtimeMode === "design" ? "block" : "none";
        if (stage) stage.style.background = runtimeMode === "screenshot" ? "transparent" : "";
        if (companion) companion.style.boxShadow = runtimeMode === "screenshot" ? "none" : "0 10px 30px rgba(0, 0, 0, 0.35)";
        document.body.style.background = runtimeMode === "screenshot" ? "transparent" : "";
        mode.textContent = "Mode: " + runtimeMode;
        queue.textContent = "Queue: " + (timelineEntries.length || 0);
        lastEvent.textContent = "Last event: " + snapshot.debug.lastEventType;
        timeline.textContent = "Timeline: " + JSON.stringify(timelineEntries.slice(-6));

        const x = Math.max(0.05, Math.min(0.95, settings.position.x));
        const y = Math.max(0.2, Math.min(0.95, settings.position.y));
        const scale = Math.max(0.5, Math.min(2, settings.scale));
        const rotate = snapshot.behavior === "walk" ? " rotate(-4deg)" : "";
        const bob = snapshot.behavior === "tinyBounce" || snapshot.behavior === "hop" ? " translateY(-4px)" : "";

        companion.style.left = (Math.floor(x * window.innerWidth) - 60) + "px";
        companion.style.top = (Math.floor(y * window.innerHeight) - 60) + "px";
        companion.style.transform = renderFrame.transform + rotate + bob;
        companion.style.opacity = renderFrame.opacity;

        const selected = themes[settings.theme] ?? themes.default;
        document.documentElement.style.setProperty("--bg", selected.bg);
        document.documentElement.style.setProperty("--accent", selected.accent);
        companion.style.background = renderFrame.background;
      });

      window.addEventListener("message", (event) => {
        if (!event.data || event.data.kind !== "event") {
          return;
        }

        const entry = {
          timestamp: Date.now(),
          event: event.data.message?.type ?? "unknown",
          payload: event.data.message?.payload ?? {}
        };
        timelineEntries.push(entry);
        if (timelineEntries.length > 24) {
          timelineEntries.shift();
        }
        lastEvent.textContent = "Last event: " + entry.event;
        queue.textContent = "Queue: " + timelineEntries.length;
        timeline.textContent = "Timeline: " + JSON.stringify(timelineEntries.slice(-6));
      });

      exportButton.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(timelineEntries, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "pixelmate-runtime-timeline.json";
        anchor.click();
        URL.revokeObjectURL(url);
      });
    </script>
  </body>
</html>`;
  }
}
