import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import {
  chainCommands,
  DOMOutputSpec,
  exitCode,
  keymap,
  Node,
} from '@bangle.dev/pm';
import { createObject } from '@bangle.dev/utils';

import { getNodeType } from './helpers';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const defaultKeys = {
  insert: 'Shift-Enter',
};

const name = 'hardBreak';

function specFactory(): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM: (): DOMOutputSpec => ['br'],
    },
    markdown: {
      toMarkdown(state: any, node: Node, parent: Node, index: number) {
        for (let i = index + 1; i < parent.childCount; i++) {
          if (parent.child(i).type !== node.type) {
            state.write('\\\n');
            return;
          }
        }
      },
      parseMarkdown: {
        hardbreak: { node: 'hardBreak' },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getNodeType(schema, name);
    const command = chainCommands(exitCode, (state, dispatch) => {
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView());
      }
      return true;
    });
    return [
      keybindings && keymap(createObject([[keybindings.insert, command]])),
    ];
  };
}
