export function logObject(obj) {
  let handler = {
    get(target, propKey, receiver) {
      const targetValue = Reflect.get(target, propKey, receiver);
      if (typeof targetValue !== 'function') {
        console.log(`getting[${propKey}]`, {
          target,
          targetValue
        });
        return targetValue;
      }
      return function(...args) {
        const result = Reflect.apply(targetValue, target, args);
        console.log(`calling[${propKey}]`, { args, result });
        return result;
      };
    }
  };
  return new Proxy(obj, handler);
}

export function logClassMethod(method, name) {
  return (...args) => {
    console.log(name, ...args);
    return method(...args);
  };
}
