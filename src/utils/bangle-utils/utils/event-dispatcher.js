export class EventDispatcher {
  constructor() {
    this.listeners = {};
  }
  on(event, cb) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(cb);
  }
  off(event, cb) {
    if (!this.listeners[event]) {
      return;
    }
    if (this.listeners[event].has(cb)) {
      this.listeners[event].delete(cb);
      return;
    }

    delete this.listeners[event];
  }
  emit(event, data) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach((cb) => cb(data));
  }
  destroy() {
    this.listeners = {};
  }
}
