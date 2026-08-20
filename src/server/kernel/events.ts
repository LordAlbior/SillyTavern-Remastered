export interface EventBus {
  on(event: string, fn: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
}

export function initBus(_config: { root: string }): EventBus {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    on(event, fn) {
      const set = handlers.get(event) ?? new Set();
      set.add(fn);
      handlers.set(event, set);
    },
    emit(event, ...args) {
      handlers.get(event)?.forEach((fn) => { try { fn(...args); } catch {} });
    },
  };
}
