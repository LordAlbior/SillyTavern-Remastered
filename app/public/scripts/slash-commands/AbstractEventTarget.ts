/**
 * @abstract
 * @implements {EventTarget}
 */
export class AbstractEventTarget {
  /**@type {Record<string, Function[]>}*/ listeners: Record<string, Function[]> = {};

  constructor() {}

  addEventListener(type: any, callback: any, _options: any) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  dispatchEvent(event: any) {
    if (!this.listeners[event.type] || this.listeners[event.type].length === 0) {
      return true;
    }
    this.listeners[event.type].forEach((listener: any) => {
      listener(event);
    });
    return true;
  }

  removeEventListener(type: any, callback: any, _options: any) {
    if (!this.listeners[type]) {
      return;
    }
    const index = this.listeners[type].indexOf(callback);
    if (index !== -1) {
      this.listeners[type].splice(index, 1);
    }
  }
}
