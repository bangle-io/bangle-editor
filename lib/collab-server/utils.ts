export function objectMapValues<T, V>(
  obj: { [key: string]: T },
  map: (value: T, key: string) => V,
) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      return [key, map(value, key)];
    }),
  );
}

export function cancelablePromise<T>(promise: Promise<T>) {
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

export function getIdleCallback(
  cb: (deadline: RequestIdleCallbackDeadline) => void,
) {
  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    return window.requestIdleCallback(cb);
  }
  var t = Date.now();
  return setTimeout(function () {
    cb({
      didTimeout: false,
      timeRemaining: function () {
        return Math.max(0, 50 - (Date.now() - t));
      },
    });
  }, 1);
}

type RequestIdleCallbackHandle = any;
type RequestIdleCallbackOptions = {
  timeout: number;
};
type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
};

type RequestIdleCallback = (
  callback: (deadline: RequestIdleCallbackDeadline) => void,
  opts?: RequestIdleCallbackOptions,
) => RequestIdleCallbackHandle;

declare global {
  interface Window {
    requestIdleCallback: RequestIdleCallback;
    cancelIdleCallback: (handle: RequestIdleCallbackHandle) => void;
  }
}

export function sleep(t = 20) {
  return new Promise((res) => setTimeout(res, t));
}

export function uuid(len = 10) {
  return Math.random().toString(36).substring(2, 15).slice(0, len);
}
