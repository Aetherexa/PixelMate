export interface RuntimeMessage<TPayload = unknown> {
  readonly type: string;
  readonly payload: TPayload;
  readonly timestamp: number;
  readonly source: string;
  readonly target: string;
  readonly version: number;
}

export type RuntimeMessageHandler<TPayload = unknown> = (message: RuntimeMessage<TPayload>) => void;
export type RuntimeMessageMiddleware<TPayload = unknown> = (
  message: RuntimeMessage<TPayload>,
  next: () => void
) => void;

export interface RuntimeMessageBusOptions {
  readonly name?: string;
  readonly logger?: (entry: string) => void;
}

export class RuntimeMessageBus<TPayload = unknown> {
  private readonly listeners = new Set<RuntimeMessageHandler<TPayload>>();
  private readonly onceListeners = new Set<RuntimeMessageHandler<TPayload>>();
  private readonly middleware: RuntimeMessageMiddleware<TPayload>[] = [];
  private readonly logger?: (entry: string) => void;
  private readonly name: string;

  public constructor(options: RuntimeMessageBusOptions = {}) {
    this.name = options.name ?? "runtime-message-bus";
    this.logger = options.logger;
  }

  public publish(message: RuntimeMessage<TPayload>): void {
    this.trace(`publish:${message.type}`);
    const dispatch = () => {
      for (const listener of Array.from(this.listeners)) {
        listener(message);
      }
      for (const listener of Array.from(this.onceListeners)) {
        listener(message);
        this.onceListeners.delete(listener);
      }
    };

    if (this.middleware.length === 0) {
      dispatch();
      return;
    }

    let index = 0;
    const run = () => {
      if (index >= this.middleware.length) {
        dispatch();
        return;
      }
      const current = this.middleware[index];
      index += 1;
      current(message, run);
    };

    run();
  }

  public subscribe(handler: RuntimeMessageHandler<TPayload>): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  public unsubscribe(handler: RuntimeMessageHandler<TPayload>): void {
    this.listeners.delete(handler);
    this.onceListeners.delete(handler);
  }

  public once(handler: RuntimeMessageHandler<TPayload>): () => void {
    this.onceListeners.add(handler);
    return () => {
      this.onceListeners.delete(handler);
    };
  }

  public broadcast(message: RuntimeMessage<TPayload>): void {
    this.publish(message);
  }

  public use(middleware: RuntimeMessageMiddleware<TPayload>): void {
    this.middleware.push(middleware);
  }

  public debugTrace(): string {
    return `${this.name}: listeners=${this.listeners.size}, once=${this.onceListeners.size}`;
  }

  private trace(entry: string): void {
    if (this.logger !== undefined) {
      this.logger(entry);
    }
  }
}
