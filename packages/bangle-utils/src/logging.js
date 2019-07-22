export function logObject(obj) {
  let handler = {
    get(target, propKey, receiver) {
      console.log({
        target,
        propKey
      });
      return Reflect.get(target, propKey, receiver);
    }
  };
  return new Proxy(obj, handler);
}
