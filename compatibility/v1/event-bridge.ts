export type LegacyEventHandler = (...args: unknown[]) => void;

export class EventBridge {
  private handlers = new Map<string, Set<LegacyEventHandler>>();

  on(event: string, handler: LegacyEventHandler) {
    const set = this.handlers.get(event) ?? new Set<LegacyEventHandler>();
    set.add(handler);
    this.handlers.set(event, set);
  }

  emit(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.forEach(handler => {
      try { handler(...args); } catch {}
    });
  }
}

export function createEventBridge(): EventBridge {
  return new EventBridge();
}
