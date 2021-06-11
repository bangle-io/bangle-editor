import { DOMOutputSpec, DOMSerializer } from 'prosemirror-model';
import type { Command } from 'prosemirror-commands';
import type { EditorView } from 'prosemirror-view';
import { isProdEnv, isTestEnv } from './environment';
const LOG = false;

function log(...args: any[]) {
  if (LOG) {
    console.log('js-utils.js', ...args);
  }
}

export function classNames(obj: any) {
  return Object.entries(obj)
    .filter((r) => Boolean(r[1]))
    .map((r) => r[0])
    .join(' ');
}

/**
 * @param {Function} fn - A unary function whose paramater is non-primitive,
 *                        so that it can be cached using WeakMap
 */
export function weakCache(fn: Function) {
  const cache = new WeakMap();
  return (arg: any) => {
    let value = cache.get(arg);
    if (value) {
      return value;
    }
    value = fn(arg);
    cache.set(arg, value);
    return value;
  };
}

export function arrayify(x: any) {
  if (x == null) {
    throw new Error('undefined value passed');
  }
  return Array.isArray(x) ? x : [x];
}

export function rafWrap(cb: Function): Function {
  return (...args: any[]) => {
    requestAnimationFrame(() => cb(...args));
  };
}

// simple higher order compose
export function compose(func: Function, ...funcs: Function[]) {
  const allFuncs = [func, ...funcs];
  return function composed(raw: any) {
    return allFuncs.reduceRight((prev, func) => func(prev), raw);
  };
}

/**
 * Runs matchAll and gives range of strings that matched and didnt match
 *
 * @param {*} regexp
 * @param {*} str
 */
export function matchAllPlus(regexp: RegExp, str: string) {
  // @ts-ignore
  const matches: RegExpMatchArray[] = Array.from(str.matchAll(regexp));
  if (matches.length === 0) {
    return [
      {
        start: 0,
        end: str.length,
        match: false,
        subString: str,
      },
    ];
  }

  let result = [];
  let prevElementEnd = 0;
  for (let cur of matches) {
    let curStart = cur.index!;
    // TODO there was an error saying length of undefined in this function
    // I suspect it is coming from line below. But not sure how to reproduce it.
    let curEnd = curStart + cur[0]!.length;

    if (prevElementEnd !== curStart) {
      result.push({
        start: prevElementEnd,
        end: curStart,
        match: false,
      });
    }
    result.push({
      start: curStart,
      end: curEnd,
      match: true,
    });
    prevElementEnd = curEnd;
  }

  const lastItemEnd =
    result[result.length - 1]! && result[result.length - 1]!.end;

  if (lastItemEnd && lastItemEnd !== str.length) {
    result.push({
      start: lastItemEnd,
      end: str.length,
      match: false,
    });
  }

  result = result.map((r) => ({ ...r, subString: str.slice(r.start, r.end) }));
  return result;
}

export function uuid(len = 10) {
  return Math.random().toString(36).substring(2, 15).slice(0, len);
}

export function getIdleCallback(cb: Function): number {
  // @ts-ignore
  if (window.requestIdleCallback) {
    // @ts-ignore
    return window.requestIdleCallback(cb);
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

type CancelablePromise<T = any> = {
  promise: Promise<T>;
  cancel: () => void;
};

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

type AnyObject = { [index: string]: any };

export function objectMapValues(
  obj: AnyObject,
  map: (value: any, key: any) => any,
): AnyObject {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      return [key, map(value, key)];
    }),
  );
}

export function objectFilter(
  obj: AnyObject,
  cb: (value: any, key: any) => boolean,
): AnyObject {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => {
      return cb(value, key);
    }),
  );
}

export function safeMergeObject(obj1 = {}, obj2 = {}) {
  const culpritKey = Object.keys(obj1).find((key) => hasOwnProperty(obj2, key));
  if (culpritKey) {
    throw new Error(`Key ${culpritKey} already exists `);
  }

  return {
    ...obj1,
    ...obj2,
  };
}

export function hasOwnProperty(obj: any, property: string) {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

// export function handleAsyncError(fn, onError) {
//   return async (...args) => {
//     return Promise.resolve(fn(...args)).catch(onError);
//   };
// }

export function serialExecuteQueue() {
  let prev = Promise.resolve();
  return {
    add: (cb: Function) => {
      return new Promise((resolve, reject) => {
        prev = prev.then(() => {
          return Promise.resolve(cb()).then(
            (resultCb) => {
              resolve(resultCb);
            },
            (err) => {
              reject(err);
            },
          );
        });
      });
    },
  };
}

export function simpleLRU<K = any, V = any>(size: number) {
  let array: Array<{ key: K; value: V }> = [];
  let removeItems = () => {
    while (array.length > size) {
      log('removing', array.shift());
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

export async function raceTimeout<T>(promise: Promise<T>, ts: number) {
  let timerId: number | null;
  let timeout = false;
  return new Promise((resolve, reject) => {
    timerId = setTimeout(() => {
      timeout = true;
      reject({ timeout: true });
    }, ts);

    promise.then(
      (result) => {
        if (timeout) {
          return;
        }
        clearTimeout(timerId!);
        timerId = null;
        resolve(result);
      },
      (error) => {
        if (timeout) {
          return;
        }
        clearTimeout(timerId!);
        timerId = null;
        reject(error);
      },
    );
  });
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
export function rafSchedule(fn: Function) {
  let lastArgs: any[] = [];
  let frameId: number | null = null;

  const wrapperFn = (...args: any[]) => {
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

export function createElement(spec: DOMOutputSpec): HTMLElement {
  const { dom, contentDOM } = DOMSerializer.renderSpec(window.document, spec);
  if (contentDOM) {
    throw new Error('createElement does not support creating contentDOM');
  }
  return dom as HTMLElement;
}

export function complement(func: Function) {
  return (...args: any[]) => !func(...args);
}

export function rafCommandExec(view: EditorView, command: Command) {
  requestAnimationFrame(() => {
    command(view.state, view.dispatch, view);
  });
}
