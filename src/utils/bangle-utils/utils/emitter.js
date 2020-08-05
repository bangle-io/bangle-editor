export class Emitter {
  constructor() {
    this._callbacks = {};
  }
  // Add an event listener for given event
  on(event, fn) {
    // Create namespace for this event
    if (!this._callbacks[event]) {
      this._callbacks[event] = [];
    }
    this._callbacks[event].push(fn);
    return this;
  }

  emit(event, ...args) {
    const callbacks = this._callbacks[event];

    if (callbacks) {
      callbacks.forEach((callback) => callback.apply(this, args));
    }

    return this;
  }

  // Remove event listener for given event.
  // If fn is not provided, all event listeners for that event will be removed.
  // If neither is provided, all event listeners will be removed.
  off(event, fn) {
    if (!arguments.length) {
      this._callbacks = {};
    } else {
      // event listeners for the given event
      const callbacks = this._callbacks ? this._callbacks[event] : null;
      if (callbacks) {
        if (fn) {
          this._callbacks[event] = callbacks.filter((cb) => cb !== fn);
          if (this._callbacks[event].length === callbacks.length) {
            console.log('problen', fn);
            throw new Error('Off called with unknown fn');
          }
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
