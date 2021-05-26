export function serialExecuteQueue<T>() {
  let prev = Promise.resolve();
  return {
    add: (cb: () => Promise<T>) => {
      return new Promise<T>((resolve, reject) => {
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

export async function raceTimeout<T>(promise: Promise<T>, ts: number) {
  let timerId: number | null;
  let timeout = false;
  return new Promise<T>((resolve, reject) => {
    timerId = setTimeout(() => {
      timeout = true;
      reject({ timeout: true });
    }, ts);

    promise.then(
      (result) => {
        if (timeout) {
          return;
        }
        if (timerId) {
          clearTimeout(timerId);
        }
        timerId = null;
        resolve(result);
      },
      (error) => {
        if (timeout) {
          return;
        }
        if (timerId) {
          clearTimeout(timerId);
        }
        timerId = null;
        reject(error);
      },
    );
  });
}

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
