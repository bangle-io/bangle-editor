/**
 */
const supportsEvent = ((event) => {
  if (event) {
    try {
      // eslint-disable-next-line no-unused-expressions
      new event('emit-init');
    } catch (e) {
      return false;
    }
  }
  return true;
})(Event);

/**
 * Build an event object in a cross-browser manner
 *
 * Usage:
 *    const event = createEvent('paste', options);
 */
export const createEvent = (name, options = {}) => {
  let event;
  if (options.bubbles === undefined) {
    options.bubbles = true;
  }
  if (options.cancelable === undefined) {
    options.cancelable = true;
  }
  if (options.composed === undefined) {
    options.composed = true;
  }
  if (supportsEvent) {
    event = new Event(name, options);
  } else {
    event = document.createEvent('Event');
    event.initEvent(name, options.bubbles, options.cancelable);
  }
  return event;
};
