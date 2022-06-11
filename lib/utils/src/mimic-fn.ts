// Copied from https://github.com/sindresorhus/mimic-fn/blob/main/index.js
// due to issues with their ESM bundling
const copyProperty = (
  to: any,
  from: any,
  property: any,
  ignoreNonConfigurable: any,
) => {
  // `Function#length` should reflect the parameters of `to` not `from` since we keep its body.
  // `Function#prototype` is non-writable and non-configurable so can never be modified.
  if (property === 'length' || property === 'prototype') {
    return;
  }

  // `Function#arguments` and `Function#caller` should not be copied. They were reported to be present in `Reflect.ownKeys` for some devices in React Native (#41), so we explicitly ignore them here.
  if (property === 'arguments' || property === 'caller') {
    return;
  }

  const toDescriptor = Object.getOwnPropertyDescriptor(to, property);
  const fromDescriptor = Object.getOwnPropertyDescriptor(from, property);

  if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) {
    return;
  }

  Object.defineProperty(to, property, fromDescriptor!);
};

// `Object.defineProperty()` throws if the property exists, is not configurable and either:
// - one its descriptors is changed
// - it is non-writable and its value is changed
const canCopyProperty = function (toDescriptor: any, fromDescriptor: any) {
  return (
    toDescriptor === undefined ||
    toDescriptor.configurable ||
    (toDescriptor.writable === fromDescriptor.writable &&
      toDescriptor.enumerable === fromDescriptor.enumerable &&
      toDescriptor.configurable === fromDescriptor.configurable &&
      (toDescriptor.writable || toDescriptor.value === fromDescriptor.value))
  );
};

const changePrototype = (to: any, from: any) => {
  const fromPrototype = Object.getPrototypeOf(from);
  if (fromPrototype === Object.getPrototypeOf(to)) {
    return;
  }

  Object.setPrototypeOf(to, fromPrototype);
};

const wrappedToString = (withName: any, fromBody: any) =>
  `/* Wrapped ${withName}*/\n${fromBody}`;

const toStringDescriptor = Object.getOwnPropertyDescriptor(
  Function.prototype,
  'toString',
);
const toStringName = Object.getOwnPropertyDescriptor(
  Function.prototype.toString,
  'name',
);

// We call `from.toString()` early (not lazily) to ensure `from` can be garbage collected.
// We use `bind()` instead of a closure for the same reason.
// Calling `from.toString()` early also allows caching it in case `to.toString()` is called several times.
const changeToString = (to: any, from: any, name: any) => {
  const withName = name === '' ? '' : `with ${name.trim()}() `;
  const newToString = wrappedToString.bind(null, withName, from.toString());
  // Ensure `to.toString.toString` is non-enumerable and has the same `same`
  Object.defineProperty(newToString, 'name', toStringName!);
  Object.defineProperty(to, 'toString', {
    ...toStringDescriptor,
    value: newToString,
  });
};

export interface Options {
  /**
	Skip modifying [non-configurable properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor#Description) instead of throwing an error.

	@default false
	*/
  readonly ignoreNonConfigurable?: boolean;
}

export function mimicFunction<
  ArgumentsType extends unknown[],
  ReturnType,
  FunctionType extends (...args: ArgumentsType) => ReturnType,
>(
  to: (...args: ArgumentsType) => ReturnType,
  from: FunctionType,
  { ignoreNonConfigurable = false }: Options = {},
) {
  const { name } = to;

  for (const property of Reflect.ownKeys(from)) {
    copyProperty(to, from, property, ignoreNonConfigurable);
  }

  changePrototype(to, from);
  changeToString(to, from, name);

  return to;
}
