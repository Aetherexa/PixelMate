export interface CompanionPersistence {
  read<T>(key: string, fallback: T): T;
  write<T>(key: string, value: T): void;
}

export class InMemoryPersistence implements CompanionPersistence {
  private readonly store = new Map<string, unknown>();

  public read<T>(key: string, fallback: T): T {
    const value = this.store.get(key);
    if (value === undefined) {
      return fallback;
    }
    return value as T;
  }

  public write<T>(key: string, value: T): void {
    this.store.set(key, value);
  }
}
