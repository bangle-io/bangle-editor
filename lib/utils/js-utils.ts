import { isProdEnv, isTestEnv } from './environment';

/**
 * @param {Function} fn - A unary function whose paramater is non-primitive,
 *                        so that it can be cached using WeakMap
 */
export function weakCache<T extends object, V>(fn: (a: T) => V) {
  const cache = new WeakMap<T, V>();
  return (arg: T): V => {
    let value = cache.get(arg);
    if (value) {
      return value;
    }
    value = fn(arg);
    cache.set(arg, value);
    return value;
  };
}

// simple higher order compose
export function compose(func: Function, ...funcs: Function[]) {
  const allFuncs = [func, ...funcs];
  return function composed(raw: any) {
    return allFuncs.reduceRight((prev, func) => func(prev), raw);
  };
}

class MatchType {
  constructor(
    public start: number,
    public end: number,
    public match: boolean,
    private sourceString: string,
  ) {}

  get subString() {
    return this.sourceString.slice(this.start, this.end);
  }
}
/**
 *
 * Returns an array of objects which contains a range of substring and whether it matched or didn't match.
 * Note: each item in this array will map 1:1 in order with the original string in a way
 *  such that following will always hold true:
 * ```
 * const result = matchAllPlus(regex, myStr);
 * result.reduce((a, b) => a + b.subString) === myStr
 * result.reduce((a, b) => a + b.slice(b.start, b.end)) === myStr
 * ```
 */
export function matchAllPlus(regexp: RegExp, str: string): MatchType[] {
  const result: MatchType[] = [];
  let prevElementEnd = 0;
  let match: RegExpExecArray | null;
  while ((match = regexp.exec(str))) {
    const curStart = match.index;
    const curEnd = curStart + match[0].length;
    if (prevElementEnd !== curStart) {
      result.push(new MatchType(prevElementEnd, curStart, false, str));
    }
    result.push(new MatchType(curStart, curEnd, true, str));
    prevElementEnd = curEnd;
  }
  if (result.length === 0) {
    return [new MatchType(0, str.length, false, str)];
  }

  const lastItemEnd =
    result[result.length - 1] && result[result.length - 1].end;

  if (lastItemEnd && lastItemEnd !== str.length) {
    result.push(new MatchType(lastItemEnd, str.length, false, str));
  }
  return result;
}

export function uuid(len = 10) {
  return Math.random().toString(36).substring(2, 15).slice(0, len);
}

export function getIdleCallback(cb: Function) {
  if (typeof window !== 'undefined' && (window as any).requestIdleCallback) {
    return (window as any).requestIdleCallback(cb);
  }
  var t = Date.now();
  return setTimeout(function () {
    cb({
      didTimeout: !1,
      timeRemaining: function () {
        return Math.max(0, 50 - (Date.now() - t));
      },
    });
  }, 1);
}

interface CancelablePromise<T = any> {
  promise: Promise<T>;
  cancel: () => void;
}

export function cancelablePromise<T>(
  promise: Promise<T>,
): CancelablePromise<T> {
  let hasCanceled = false;

  const wrappedPromise = new Promise<T>((resolve, reject) =>
    promise
      .then((val) =>
        hasCanceled ? reject({ isCanceled: true }) : resolve(val),
      )
      .catch((error) =>
        hasCanceled ? reject({ isCanceled: true }) : reject(error),
      ),
  );

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled = true;
    },
  };
}

export function sleep(t = 20) {
  return new Promise((res) => setTimeout(res, t));
}

export function objectMapValues<T, K>(
  obj: { [s: string]: T },
  map: (value: T, key: string) => K,
): { [s: string]: K } {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      return [key, map(value, key)];
    }),
  );
}

export function objectFilter<T>(
  obj: { [s: string]: T },
  cb: (value: T, key: string) => boolean,
): { [s: string]: T } {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => {
      return cb(value, key);
    }),
  );
}

/**
 * Creates an object from an array of [key, Value], filtering out any
 * undefined or null key
 */
export function createObject<T>(
  entries: Array<[string | null | undefined, T]>,
): {
  [k: string]: T;
} {
  return Object.fromEntries(entries.filter((e) => e[0] != null));
}

export function serialExecuteQueue() {
  let prev = Promise.resolve();
  return {
    add<T>(cb: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const run = async () => {
          try {
            const result = await cb();
            return {
              rejected: false,
              value: result,
            };
          } catch (e) {
            return {
              rejected: true,
              value: e,
            };
          }
        };

        prev = prev.then(() => {
          return run().then(({ value, rejected }) => {
            if (rejected) {
              reject(value);
            } else {
              resolve(value);
            }
          });
        });
      });
    },
  };
}

export function simpleLRU<K = any, V = any>(size: number) {
  let array: Array<{ key: K; value: V }> = [];
  let removeItems = () => {
    while (array.length > size) {
      array.shift();
    }
  };
  return {
    entries() {
      return array.slice(0);
    },

    remove(key: K) {
      array = array.filter((item) => item.key !== key);
    },

    clear() {
      array = [];
    },

    get(key: K) {
      let result = array.find((item) => item.key === key);
      if (result) {
        this.set(key, result.value); // put the item in the front
        return result.value;
      }
    },
    set(key: K, value: V) {
      this.remove(key);
      array.push({ key, value });
      removeItems();
    },
  };
}

export function domEventListener(
  element: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
) {
  element.addEventListener(type, listener, options);
  return () => {
    element.removeEventListener(type, listener, options);
  };
}

/**
 * Based on idea from https://github.com/alexreardon/raf-schd
 * Throttles the function and calls it with the latest argument
 */
export function rafSchedule<T>(fn: (...args: T[]) => void) {
  let lastArgs: any[] = [];
  let frameId: number | null = null;

  const wrapperFn = (...args: T[]) => {
    // Always capture the latest value
    lastArgs = args;

    // There is already a frame queued
    if (frameId) {
      return;
    }

    // Schedule a new frame
    frameId = requestAnimationFrame(() => {
      frameId = null;
      fn(...lastArgs);
    });
  };

  // Adding cancel property to result function
  wrapperFn.cancel = () => {
    if (!frameId) {
      return;
    }
    cancelAnimationFrame(frameId);
    frameId = null;
  };

  return wrapperFn;
}

export const bangleWarn =
  isTestEnv || isProdEnv
    ? () => {}
    : console.warn.bind(console, 'Warning in bangle.js:');
