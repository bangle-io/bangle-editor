// copied from https://github.com/sindresorhus/debounce-fn
// due to issues with their ESM bundling
import { mimicFunction } from './mimic-fn';

export interface Options {
  /**
	Time in milliseconds to wait until the `input` function is called.
	@default 0
	*/
  readonly wait?: number;

  /**
	The maximum time the `input` function is allowed to be delayed before it's invoked.
	This can be used to control the rate of calls handled in a constant stream. For example, a media player sending updates every few milliseconds but wants to be handled only once a second.
	@default Infinity
	*/
  readonly maxWait?: number;

  /**
	Trigger the function on the leading edge of the `wait` interval.
	For example, this can be useful for preventing accidental double-clicks on a "submit" button from firing a second time.
	@default false
	*/
  readonly before?: boolean;

  /**
	Trigger the function on the trailing edge of the `wait` interval.
	@default true
	*/
  readonly after?: boolean;
}

export interface DebouncedFunction<ArgumentsType extends unknown[], RetType> {
  (...args: ArgumentsType): RetType;
  cancel(): void;
}

export function debounceFn<ArgumentsType extends unknown[], RetType>(
  inputFunction: (...args: ArgumentsType) => RetType,
  options: Options,
): DebouncedFunction<ArgumentsType, undefined>;
export function debounceFn<ArgumentsType extends unknown[], RetType>(
  inputFunction: (...args: ArgumentsType) => RetType,
  options: Options = {},
) {
  if (typeof inputFunction !== 'function') {
    throw new TypeError(
      `Expected the first argument to be a function, got \`${typeof inputFunction}\``,
    );
  }

  const {
    wait = 0,
    maxWait = Infinity,
    before = false,
    after = true,
  } = options;

  if (!before && !after) {
    throw new Error(
      "Both `before` and `after` are false, function wouldn't be called.",
    );
  }

  let timeout: undefined | ReturnType<typeof setTimeout>;
  let maxTimeout: undefined | ReturnType<typeof setTimeout>;
  let result: RetType;

  const debouncedFunction = function (this: any, ...arguments_: any[]) {
    const context = this;

    const later = () => {
      timeout = undefined;

      if (maxTimeout) {
        clearTimeout(maxTimeout);
        maxTimeout = undefined;
      }

      if (after) {
        result = inputFunction.apply(context, arguments_ as any);
      }
    };

    const maxLater = () => {
      maxTimeout = undefined;

      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }

      if (after) {
        result = inputFunction.apply(context, arguments_ as any);
      }
    };

    const shouldCallNow = before && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (maxWait > 0 && maxWait !== Infinity && !maxTimeout) {
      maxTimeout = setTimeout(maxLater, maxWait);
    }

    if (shouldCallNow) {
      result = inputFunction.apply(context, arguments_ as any);
    }

    return result;
  };

  mimicFunction(debouncedFunction, inputFunction as any);

  debouncedFunction.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    if (maxTimeout) {
      clearTimeout(maxTimeout);
      maxTimeout = undefined;
    }
  };

  return debouncedFunction;
}
