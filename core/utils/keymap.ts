import { keymap as pmKeymap } from 'prosemirror-keymap';
import type { Keymap } from 'prosemirror-commands';
import type { Plugin } from 'prosemirror-state';

const MONITOR =
  // @ts-ignore
  typeof window !== 'undefined' ? window.BANGLE_DEBUG_KEYBINDINGS : true;

const cache = new WeakMap();

export function keymap(bindings: Keymap, { monitor = MONITOR } = {}) {
  let flatBindings = Object.entries(bindings)
    .flatMap(([key, value]) => {
      // .entries() stringifies nully keys
      if (!key || key === 'undefined' || key === 'null' || key === 'false') {
        return [];
      }
      // Allows for defining multiple keys to single command
      // for example ['Z A', Command], will map Z and A to command
      return key.split(' ').map((k) => [k, value]);
    })
    .filter(([_, value]) => value != null);

  const normalizedBindings = Object.fromEntries(flatBindings);

  const plugin = pmKeymap(normalizedBindings);
  if (monitor) {
    cache.set(plugin, normalizedBindings);
  }

  return plugin;
}

export function debugPrintDuplicateKeybindings(plugins: Plugin[]) {
  const bindings = plugins.map((r) => [cache.get(r), r]).filter((r) => r[0]);
  console.log(bindings);
  return bindings;
}

export const bangleKeymap = keymap;
