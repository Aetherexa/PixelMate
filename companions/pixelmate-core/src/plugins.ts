import type { CompanionBehavior } from "./model.js";

export interface BehaviorDecisionContext {
  readonly idleMs: number;
  readonly hasErrors: boolean;
  readonly editorFocused: boolean;
}

export interface CompanionBehaviorPlugin {
  readonly id: string;
  onEvent?(eventType: string, context: BehaviorDecisionContext): CompanionBehavior | undefined;
  onTick?(context: BehaviorDecisionContext): CompanionBehavior | undefined;
}

export class CompanionPluginHost {
  private readonly plugins = new Map<string, CompanionBehaviorPlugin>();

  public register(plugin: CompanionBehaviorPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  public decideOnEvent(
    eventType: string,
    context: BehaviorDecisionContext
  ): CompanionBehavior | undefined {
    for (const plugin of this.plugins.values()) {
      const result = plugin.onEvent?.(eventType, context);
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }

  public decideOnTick(context: BehaviorDecisionContext): CompanionBehavior | undefined {
    for (const plugin of this.plugins.values()) {
      const result = plugin.onTick?.(context);
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }
}
