import { AnimationController, SpriteManager } from "./animation.js";
import { decideBehavior } from "./behaviors.js";
import { CompanionEventBus, type CompanionEvent } from "./events.js";
import {
  DEFAULT_LOCALIZATION,
  DEFAULT_PLACEHOLDER_SPRITES,
  DEFAULT_THEMES,
  PIXELMATE_CORE_MANIFEST
} from "./manifest.js";
import { CompanionMemoryStore, DEFAULT_MEMORY } from "./memory.js";
import type {
  CompanionBehavior,
  CompanionHooks,
  CompanionIntent,
  CompanionLifecycleState,
  CompanionSnapshot,
  CompanionTheme,
  NeedsState,
  PersonalityId
} from "./model.js";
import { applyNeedEvent, DEFAULT_NEEDS, updateNeedsByDrift } from "./needs.js";
import { InMemoryPersistence, type CompanionPersistence } from "./persistence.js";
import { getPersonalityProfile } from "./personality.js";
import { CompanionPluginHost } from "./plugins.js";
import { DEFAULT_SETTINGS, mergeSettings, type CompanionSettings } from "./settings.js";
import { chooseIntent } from "./intent.js";
import { CompanionScheduler } from "./scheduler.js";

const SETTINGS_KEY = "pixelmate.core.settings";
const MEMORY_KEY = "pixelmate.core.memory";
const THINK_STEP_MS = 350;

const NOOP_HOOKS: CompanionHooks = {
  sound: {
    play: () => undefined
  },
  particles: {
    emit: () => undefined
  }
};

export interface KernelDependencies {
  readonly persistence?: CompanionPersistence;
  readonly hooks?: CompanionHooks;
  readonly now?: () => number;
}

export class PixelMateCompanionKernel {
  private readonly persistence: CompanionPersistence;
  private readonly hooks: CompanionHooks;
  private readonly now: () => number;
  private readonly eventBus = new CompanionEventBus();
  private readonly pluginHost = new CompanionPluginHost();
  private readonly scheduler = new CompanionScheduler();
  private readonly animation = new AnimationController();
  private readonly sprites = new SpriteManager(DEFAULT_PLACEHOLDER_SPRITES);
  private readonly memoryStore: CompanionMemoryStore;

  private lifecycle: CompanionLifecycleState = "loading";
  private settings: CompanionSettings;
  private locale = DEFAULT_LOCALIZATION.locale;
  private themes: ReadonlyArray<CompanionTheme> = DEFAULT_THEMES;
  private behavior: CompanionBehavior = "idle";
  private intent: CompanionIntent = "observe";
  private frame = "idle-1";
  private idleMs = 0;
  private editorFocused = true;
  private hasErrors = false;
  private lastEventType: CompanionEvent["type"] | null = null;
  private ticks = 0;
  private eventsProcessed = 0;
  private lastTickDurationMs = 0;
  private frameTimeMs = THINK_STEP_MS;
  private fps = 0;
  private accumulatedThinkMs = THINK_STEP_MS;
  private needs: NeedsState = DEFAULT_NEEDS;
  private cooldowns: Partial<Record<CompanionBehavior, number>> = {};
  private queuedBehaviors: CompanionBehavior[] = [];
  private pendingPluginBehavior: CompanionBehavior | undefined;

  public constructor(dependencies: KernelDependencies = {}) {
    this.persistence = dependencies.persistence ?? new InMemoryPersistence();
    this.hooks = dependencies.hooks ?? NOOP_HOOKS;
    this.now = dependencies.now ?? (() => Date.now());
    this.settings = this.persistence.read(SETTINGS_KEY, DEFAULT_SETTINGS);

    const savedMemory = this.persistence.read(MEMORY_KEY, DEFAULT_MEMORY);
    this.memoryStore = new CompanionMemoryStore(savedMemory);

    this.eventBus.subscribe((event) => {
      this.processEvent(event);
    });

    this.lifecycle = "stopped";
  }

  public getManifest() {
    return PIXELMATE_CORE_MANIFEST;
  }

  public getThemes(): ReadonlyArray<CompanionTheme> {
    return this.themes;
  }

  public start(): void {
    this.lifecycle = "running";
    this.handleEvent({ type: "vscodeStarted", at: this.now() });
  }

  public stop(): void {
    this.lifecycle = "stopped";
    this.persistMemory();
  }

  public dispose(): void {
    this.lifecycle = "disposed";
    this.persistMemory();
  }

  public handleEvent(event: CompanionEvent): void {
    this.eventBus.publish(event);
  }

  public updateSettings(partial: Partial<CompanionSettings>): CompanionSettings {
    this.settings = mergeSettings(this.settings, partial);
    this.persistence.write(SETTINGS_KEY, this.settings);
    return this.settings;
  }

  public getSettings(): CompanionSettings {
    return this.settings;
  }

  public loadAssets(): void {
    this.sprites.load(DEFAULT_PLACEHOLDER_SPRITES);
    this.lifecycle = this.lifecycle === "disposed" ? "disposed" : "stopped";
  }

  public setLocale(locale: string): void {
    this.locale = locale;
  }

  public registerBehaviorPlugin(plugin: Parameters<CompanionPluginHost["register"]>[0]): void {
    this.pluginHost.register(plugin);
  }

  public tick(deltaMs: number): CompanionSnapshot {
    const start = this.now();

    if (this.lifecycle === "stopped" || this.lifecycle === "disposed") {
      this.lastTickDurationMs = this.now() - start;
      return this.createSnapshot();
    }

    this.idleMs += deltaMs;
    this.memoryStore.advanceSession(deltaMs);

    const boundedDeltaMs = Math.max(0, deltaMs);
    this.needs = updateNeedsByDrift(this.needs, boundedDeltaMs);
    this.accumulatedThinkMs += boundedDeltaMs;

    const runThinkLoop = this.accumulatedThinkMs >= THINK_STEP_MS;
    if (runThinkLoop) {
      const next = this.scheduler.tick(
        {
          deltaMs: this.accumulatedThinkMs,
          current: {
            needs: this.needs,
            intent: this.intent,
            behavior: this.behavior
          }
        },
        (_schedulerDeltaMs, currentNeeds) => currentNeeds,
        (currentNeeds) => {
          const personality = getPersonalityProfile(this.settings.personality);
          return chooseIntent(
            {
              needs: currentNeeds,
              lastEventType: this.lastEventType,
              isFocused: this.editorFocused,
              hasErrors: this.hasErrors,
              idleMs: this.idleMs,
              focusMode: this.settings.focusMode
            },
            personality
          );
        },
        (intent, currentNeeds) => {
          const personality = getPersonalityProfile(this.settings.personality);
          const pluginOnTickDecision = this.pluginHost.decideOnTick({
            idleMs: this.idleMs,
            hasErrors: this.hasErrors,
            editorFocused: this.editorFocused
          });

          return (
            pluginOnTickDecision ??
            this.pendingPluginBehavior ??
            decideBehavior({
              settings: this.settings,
              intent,
              needs: currentNeeds,
              personality,
              idleMs: this.idleMs,
              editorFocused: this.editorFocused,
              hasErrors: this.hasErrors,
              lastEventType: this.lastEventType,
              randomSeed: this.ticks,
              now: this.now(),
              lastBehavior: this.behavior,
              cooldowns: this.cooldowns
            })
          );
        }
      );

      this.intent = next.intent;
      this.behavior = next.behavior;
      this.pendingPluginBehavior = undefined;

      this.applyBehaviorEffects(this.behavior);
      this.enqueueBehavior(this.behavior);
      this.accumulatedThinkMs = 0;
    }

    const activeBehavior = this.queuedBehaviors.shift() ?? this.behavior;
    this.animation.setBehavior(activeBehavior);

    const personality = getPersonalityProfile(this.settings.personality);
    const frames = this.sprites.getFrames(activeBehavior);
    this.frame = this.animation.advance({
      deltaMs: boundedDeltaMs,
      frames,
      speed: this.settings.speed * this.settings.movementSpeed * personality.reactionSpeed,
      animationFrequency: this.settings.animationFrequency * personality.animationFrequencyBoost,
      reduceMotion: this.settings.reduceMotion || this.settings.accessibilityMode
    });

    this.lifecycle = activeBehavior === "sleep" ? "sleeping" : "running";

    this.ticks += 1;
    this.lastTickDurationMs = this.now() - start;
    this.frameTimeMs = this.lastTickDurationMs;
    this.fps = this.lastTickDurationMs <= 0 ? 120 : 1000 / this.lastTickDurationMs;

    this.persistMemory();
    return this.createSnapshot();
  }

  private processEvent(event: CompanionEvent): void {
    this.lastEventType = event.type;
    this.eventsProcessed += 1;

    this.memoryStore.onEvent(event);
    this.needs = applyNeedEvent(this.needs, event);
    this.accumulatedThinkMs = THINK_STEP_MS;

    const pluginContext = {
      idleMs: this.idleMs,
      hasErrors: this.hasErrors,
      editorFocused: this.editorFocused
    };
    this.pendingPluginBehavior = this.pluginHost.decideOnEvent(event.type, pluginContext);

    if (
      event.type === "activity" ||
      event.type === "typingStarted" ||
      event.type === "editorChanged"
    ) {
      this.idleMs = 0;
      return;
    }

    if (event.type === "editorFocus" || event.type === "windowFocus") {
      this.editorFocused = true;
      this.idleMs = 0;
      return;
    }

    if (event.type === "editorBlur" || event.type === "windowBlur") {
      this.editorFocused = false;
      return;
    }

    if (event.type === "diagnosticError" || event.type === "buildError") {
      this.hasErrors = true;
      return;
    }

    if (event.type === "diagnosticClear" || event.type === "buildSuccess") {
      this.hasErrors = false;
      return;
    }

    if (event.type === "idleTimeout") {
      this.lifecycle = "sleeping";
    }
  }

  private enqueueBehavior(behavior: CompanionBehavior): void {
    if (behavior === "doubleBlink") {
      this.queuedBehaviors.push("blink", "blink");
      return;
    }

    this.queuedBehaviors.push(behavior);
  }

  private applyBehaviorEffects(behavior: CompanionBehavior): void {
    const now = this.now();
    const cooldownByBehavior: Readonly<Partial<Record<CompanionBehavior, number>>> = {
      celebrate: now + 6_000,
      wave: now + 3_000,
      hop: now + 1_400,
      scratchHead: now + 2_500,
      doubleBlink: now + 1_200,
      wake: now + 5_000
    };

    this.cooldowns = {
      ...this.cooldowns,
      ...cooldownByBehavior
    };

    if (behavior === "celebrate") {
      this.hooks.particles.emit("celebrate");
      this.hooks.sound.play("chime");
      this.memoryStore.markCelebration(now);
      return;
    }

    if (behavior === "walk") {
      this.memoryStore.markWalk(now);
      return;
    }

    if (behavior === "sleep") {
      this.memoryStore.markSleep(now);
    }
  }

  private persistMemory(): void {
    this.persistence.write(MEMORY_KEY, this.memoryStore.getSnapshot());
  }

  private createSnapshot(): CompanionSnapshot {
    const personality: PersonalityId = this.settings.personality;
    return {
      state: this.lifecycle,
      intent: this.intent,
      behavior: this.behavior,
      frame: this.frame,
      lifecycle: this.lifecycle,
      idleMs: this.idleMs,
      locale: this.locale,
      personality,
      needs: this.needs,
      memory: this.memoryStore.getSnapshot(),
      theme: this.settings.theme,
      reducedMotion: this.settings.reduceMotion,
      debug: {
        behaviorQueue: this.queuedBehaviors,
        lastEventType: this.lastEventType
      },
      metrics: {
        ticks: this.ticks,
        eventsProcessed: this.eventsProcessed,
        lastTickDurationMs: this.lastTickDurationMs,
        frameTimeMs: this.frameTimeMs,
        fps: this.fps,
        idleCpuHint: this.lifecycle === "sleeping" ? "low" : "active"
      }
    };
  }
}
