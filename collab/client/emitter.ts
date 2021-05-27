interface Listeners<T> {
  [name: string]: Listener<T>[];
}
type Listener<T = any> = (data: T) => void;

export class Emitter<T = any> {
  _callbacks: Listeners<T> = {};

  // Add an event listener for given event
  on(event: any, fn: any) {
    // Create namespace for this event
    if (!this._callbacks[event]) {
      this._callbacks[event] = [];
    }
    this._callbacks[event]!.push(fn);
    return this;
  }

  emit(event: any, data: any) {
    const callbacks = this._callbacks[event];

    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }

    return this;
  }

  // Remove event listener for given event.
  // If fn is not provided, all event listeners for that event will be removed.
  // If neither is provided, all event listeners will be removed.
  off(event: string, fn: Listener<T>) {
    if (!arguments.length) {
      this._callbacks = {};
    } else {
      // event listeners for the given event
      const callbacks = this._callbacks ? this._callbacks[event] : null;
      if (callbacks) {
        if (fn) {
          this._callbacks[event] = callbacks.filter((cb) => cb !== fn);
        } else {
          this._callbacks[event] = []; // remove all handlers
        }
      }
    }

    return this;
  }

  destroy() {
    this._callbacks = {};
  }
}
