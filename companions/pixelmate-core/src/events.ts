export type CompanionEventType =
  | "vscodeStarted"
  | "workspaceLoaded"
  | "workspaceClosed"
  | "editorChanged"
  | "typingStarted"
  | "typingStopped"
  | "cursorIdle"
  | "editorFocus"
  | "editorBlur"
  | "buildStarted"
  | "buildSuccess"
  | "buildError"
  | "gitCommit"
  | "terminalRunning"
  | "themeChanged"
  | "windowFocus"
  | "windowBlur"
  | "idleTime"
  | "diagnosticError"
  | "diagnosticClear"
  | "idleTimeout"
  | "activity"
  | "openFilesChanged";

export interface CompanionEvent {
  readonly type: CompanionEventType;
  readonly at: number;
  readonly payload?: Readonly<Record<string, number | string | boolean | null>>;
}

export type CompanionEventListener = (event: CompanionEvent) => void;

export class CompanionEventBus {
  private readonly listeners = new Set<CompanionEventListener>();

  public subscribe(listener: CompanionEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public publish(event: CompanionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
