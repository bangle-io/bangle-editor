const LOG = false;
let log = LOG ? console.log.bind(console, 'play/misc') : () => {};

export function strictCheckObject(obj, assert) {
  const entries = Object.entries(obj);
  const keys = (o) => Object.keys(o);

  if (keys(obj).length !== keys(assert).length) {
    log({
      obj,
      assert,
    });
    throw new Error('Size miss match');
  }
  if (!keys(obj).every((r) => keys(assert).includes(r))) {
    log({
      obj,
      assert,
    });
    throw new Error('missing keys match');
  }
  for (const [key, value] of entries) {
    const type = assert[key];
    if (!type) {
      log(value);
      throw new Error('Unkown key:' + key);
    } else if (type === 'string') {
      if (typeof value !== 'string') {
        log(value);
        throw new Error(`${key} expected ${type} got ${value}`);
      }
    } else if (type === 'number') {
      if (typeof value !== 'number') {
        log(value);
        throw new Error(`${key} expected ${type} got ${value}`);
      }
    } else if (type === 'object') {
      const check = typeof value === 'object' && !Array.isArray(value);
      if (!check) {
        throw new Error(`${key} expected ${type} got ${value}`);
      }
    } else if (type === 'array-of-strings') {
      const check =
        Array.isArray(value) && value.every((v) => typeof v === 'string');
      if (!check) {
        log(value);
        throw new Error(`${key} expected ${type} got ${value}`);
      }
    } else if (type === 'array-of-objects') {
      const check =
        Array.isArray(value) &&
        value.every((v) => typeof v === 'object' && !Array.isArray(v));
      if (!check) {
        log(value);
        throw new Error(`${key} expected ${type} got ${value}`);
      }
    } else {
      throw new Error(`${type} is not implemented`);
    }
  }
}
