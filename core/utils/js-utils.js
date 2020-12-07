import { DOMSerializer } from 'prosemirror-model';

const LOG = false;

function log(...args) {
  if (LOG) {
    console.log('js-utils.js', ...args);
  }
}

export function classNames(obj) {
  return Object.entries(obj)
    .filter((r) => Boolean(r[1]))
    .map((r) => r[0])
    .join(' ');
}

/**
 * @param {Function} fn - A unary function whose paramater is non-primitive,
 *                        so that it can be cached using WeakMap
 */
export function weakCache(fn) {
  const cache = new WeakMap();
  return (arg) => {
    let value = cache.get(arg);
    if (value) {
      return value;
    }
    value = fn(arg);
    cache.set(arg, value);
    return value;
  };
}

export function arrayify(x) {
  if (x == null) {
    throw new Error('undefined value passed');
  }
  return Array.isArray(x) ? x : [x];
}

export function rafWrap(cb) {
  return (...args) => {
    requestAnimationFrame(() => cb(...args));
  };
}

// simple higher order compose
export function compose(func, ...funcs) {
  const allFuncs = [func, ...funcs];
  return function composed(raw) {
    return allFuncs.reduceRight((prev, func) => func(prev), raw);
  };
}

/**
 * Runs matchAll and gives range of strings that matched and didnt match
 *
 * @param {*} regexp
 * @param {*} str
 */
export function matchAllPlus(regexp, str) {
  const matches = [...str.matchAll(regexp)];
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
  for (let i = 0; i < matches.length; i++) {
    let cur = matches[i];
    let curStart = cur.index;
    let curEnd = curStart + cur[0].length;

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

  const lastItemEnd = result[result.length - 1]?.end;

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

export function getIdleCallback(cb) {
  if (window.requestIdleCallback) {
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

export function cancelablePromise(promise) {
  let hasCanceled = false;

  const wrappedPromise = new Promise((resolve, reject) =>
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

/**
 * @typedef {(value: any, key: string) => any} Mapper
 * @param {Object} obj
 * @param {Mapper} map
 */
export function objectMapValues(obj, map) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      return [key, map(value, key)];
    }),
  );
}

/**
 * @typedef {(value: any, key: string) => boolean} objectFilterCb
 * @param {Object} obj
 * @param {objectFilterCb} cb
 */
export function objectFilter(obj, cb) {
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

export function hasOwnProperty(obj, property) {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

export function handleAsyncError(fn, onError) {
  return async (...args) => {
    return Promise.resolve(fn(...args)).catch(onError);
  };
}

export function serialExecuteQueue() {
  let prev = Promise.resolve();
  return {
    add: (cb) => {
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

export function simpleLRU(size) {
  let array = [];
  let removeItems = () => {
    while (array.length > size) {
      log('removing', array.shift());
    }
  };
  return {
    entries() {
      return array.slice(0);
    },

    remove(key) {
      array = array.filter((item) => item.key !== key);
    },

    clear() {
      array = undefined;
    },

    get(key) {
      let result = array.find((item) => item.key === key);
      if (result) {
        this.set(key, result.value); // put the item in the front
        return result.value;
      }
    },
    set(key, value) {
      this.remove(key);
      array.push({ key, value });
      removeItems();
    },
  };
}

export async function raceTimeout(promise, ts) {
  let timerId;
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
        clearTimeout(timerId);
        timerId = null;
        resolve(result);
      },
      (error) => {
        if (timeout) {
          return;
        }
        clearTimeout(timerId);
        timerId = null;
        reject(error);
      },
    );
  });
}

export function domEventListener(element, type, listener, options) {
  element.addEventListener(type, listener, options);
  return () => {
    element.removeEventListener(type, listener, options);
  };
}

/**
 * Based on idea from https://github.com/alexreardon/raf-schd
 * Throttles the function and calls it with the latest argument
 * @param {Function} fn
 */
export function rafSchedule(fn) {
  let lastArgs = [];
  let frameId = null;

  const wrapperFn = (...args) => {
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
  process.env.NODE_ENV === 'test'
    ? () => {}
    : console.warn.bind(console, 'Warning in bangle.js:');

export function createElement(spec) {
  const { dom, contentDOM } = DOMSerializer.renderSpec(window.document, spec);
  if (contentDOM) {
    throw new Error('createElement does not support creating contentDOM');
  }
  return dom;
}

export function fNot(func) {
  return (...args) => !func(...args);
}

export function rafCommandExec(view, command) {
  requestAnimationFrame(() => {
    command(view.state, view.dispatch, view);
  });
}
