import { Selection } from 'prosemirror-state';
const LOG = false;

let log = LOG ? console.log.bind(console, 'collab/helpers') : () => {};

export function replaceDocument(state, doc, version) {
  const { schema, tr } = state;
  const content = (doc.content || []).map((child) =>
    schema.nodeFromJSON(child),
  );
  const hasContent = Array.isArray(content)
    ? content.length > 0
    : Boolean(content);

  if (!hasContent) {
    return tr;
  }

  tr.setMeta('addToHistory', false);
  tr.replaceWith(0, state.doc.nodeSize - 2, content);
  tr.setSelection(Selection.atStart(tr.doc));

  if (typeof version !== undefined) {
    const collabState = { version, unconfirmed: [] };
    tr.setMeta('collab$', collabState);
  }

  return tr;
}

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

export function repeatValue(val, n) {
  return Array.from({ length: n }, () => val);
}
