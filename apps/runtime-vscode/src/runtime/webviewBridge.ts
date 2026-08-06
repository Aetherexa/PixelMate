export interface WebviewBridgeMessage {
  readonly type: string;
  readonly payload?: unknown;
  readonly requestId?: string;
}

export class WebviewBridge {
  private readonly listeners = new Set<(message: WebviewBridgeMessage) => void>();
  private readonly pendingRequests = new Map<string, (value: unknown) => void>();

  public onMessage(handler: (message: WebviewBridgeMessage) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  public emit(message: WebviewBridgeMessage): void {
    for (const listener of Array.from(this.listeners)) {
      listener(message);
    }
  }

  public async request<TResponse>(message: WebviewBridgeMessage): Promise<TResponse> {
    const requestId =
      message.requestId ?? `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const requestMessage = { ...message, requestId };
    return await new Promise<TResponse>((resolve) => {
      this.pendingRequests.set(requestId, resolve as (value: unknown) => void);
      this.emit(requestMessage);
    });
  }

  public respond(requestId: string, payload: unknown): void {
    this.emit({ type: "response", payload, requestId });
  }

  public receive(message: WebviewBridgeMessage): void {
    if (message.requestId !== undefined && message.type === "response") {
      this.pendingRequests.get(message.requestId)?.(message.payload);
      this.pendingRequests.delete(message.requestId);
      return;
    }

    this.emit(message);
  }
}
