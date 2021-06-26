import { keymap as pmKeymap } from 'prosemirror-keymap';
import type { Command, Keymap } from 'prosemirror-commands';

/**
 * Some improvements over vanilla pm keymaps
 * - Ignores keys which have `'undefined'` `'null'`, `'false'` as keys. not that these are
 *    strings as JS object keys are strings.
 * - Allows for defining multiple keys to single command
 *    for example ['Z A', Command], will map Z and A to command
 *
 */
export function keymap(bindings: Partial<Keymap>) {
  let flatBindings = Object.entries(bindings).flatMap(([key, value]): Array<
    [string, Command]
  > => {
    // .entries() stringifies nully keys
    if (
      value == null ||
      !key ||
      key === 'undefined' ||
      key === 'null' ||
      key === 'false'
    ) {
      return [];
    }

    return key.split(' ').map((k) => [k, value]);
  });

  const normalizedBindings = Object.fromEntries(flatBindings);

  const plugin = pmKeymap(normalizedBindings);

  return plugin;
}
