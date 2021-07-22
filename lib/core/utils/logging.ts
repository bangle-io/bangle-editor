export function logObject(obj: any) {
  let handler: ProxyHandler<any> = {
    get(target, propKey, receiver: any) {
      const targetValue = Reflect.get(target, propKey, receiver);
      if (typeof targetValue !== 'function') {
        console.log(`getting[${String(propKey)}]`, {
          target,
          targetValue,
        });
        return targetValue;
      }
      return function (...args: any[]) {
        const result = Reflect.apply(targetValue, target, args);
        console.log(`calling[${String(propKey)}]`, { args, result });
        return result;
      };
    },
  };
  return new Proxy(obj, handler);
}

export function logClassMethod(method: Function, name: string) {
  return (...args: any[]) => {
    console.log(name, ...args);
    return method(...args);
  };
}
