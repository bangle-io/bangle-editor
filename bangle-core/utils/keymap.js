import { keymap as pmKeymap } from 'prosemirror-keymap';
import { objectFilter } from './js-utils';

const MONITOR = window.BANGLE_DEBUG_KEYBINDINGS || true;

const cache = new WeakMap();

export function keymap(bindings, { monitor = MONITOR } = {}) {
  bindings = objectFilter(
    bindings,
    (value, key) => typeof key === 'string' && Boolean(value),
  );

  const plugin = pmKeymap(bindings);
  if (monitor) {
    cache.set(plugin, bindings);
  }

  return plugin;
}

export function debugPrintDuplicateKeybindings(plugins) {
  const bindings = plugins.map((r) => [cache.get(r), r]).filter((r) => r[0]);
  console.log(bindings);
  return bindings;
}
