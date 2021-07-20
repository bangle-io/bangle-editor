import {
  chainCommands,
  Command,
  DOMOutputSpecArray,
  EditorState,
  keymap,
  Node,
  Schema,
  wrappingInputRule,
} from '@bangle.dev/pm';
import type Token from 'markdown-it/lib/token';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import { parentHasDirectParentOfType } from '../core-commands';
import { RawSpecs } from '../spec-registry';
import { RawPlugins } from '../utils/plugin-loader';
import { toggleList } from './list-item/commands';
import { listIsTight } from './list-item/list-is-tight';
import {
  isNodeTodo,
  removeTodo,
  setTodo,
  wrappingInputRuleForTodo,
} from './list-item/todo';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleBulletList,
  queryIsBulletListActive,
};
export const defaultKeys = {
  toggle: 'Shift-Ctrl-8',
  toggleTodo: 'Shift-Ctrl-7',
};

const name = 'bulletList';

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function specFactory(): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      content: 'listItem+',
      group: 'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM: (): DOMOutputSpecArray => ['ul', 0],
      attrs: {
        // a style preference attribute which be used for
        // rendering output.
        // For example markdown serializer can render a new line in
        // between or not.
        tight: {
          default: false,
        },
      },
    },
    markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
        state.renderList(node, '  ', () => '- ');
      },
      parseMarkdown: {
        bullet_list: {
          block: name,
          getAttrs: (_: any, tokens: Token[], i: number) => {
            return { tight: listIsTight(tokens, i) };
          },
        },
      },
    },
  };
}

function pluginsFactory({
  markdownShortcut = true,
  todoMarkdownShortcut = true,
  keybindings = defaultKeys,
} = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      keybindings &&
        keymap({
          [keybindings.toggle]: toggleBulletList(),
          [keybindings.toggleTodo]: toggleTodoList(),
        }),
      markdownShortcut &&
        wrappingInputRule(/^\s*([-+*])\s$/, type, undefined, (_str, node) => {
          if (node.lastChild && isNodeTodo(node.lastChild, schema)) {
            return false;
          }
          return true;
        }),
      todoMarkdownShortcut &&
        wrappingInputRuleForTodo(/^\s*(\[ \])\s$/, {
          todoChecked: false,
        }),
    ];
  };
}

export function toggleBulletList(): Command {
  const handleBulletLists: Command = (state, dispatch, view) =>
    toggleList(state.schema.nodes.bulletList, state.schema.nodes.listItem)(
      state,
      dispatch,
      view,
    );

  return chainCommands(removeTodo, handleBulletLists);
}

export function toggleTodoList(): Command {
  const fallback: Command = (state, dispatch, view) =>
    toggleList(
      state.schema.nodes.bulletList,
      state.schema.nodes.listItem,
      true,
    )(state, dispatch, view);

  return chainCommands(setTodo, fallback);
}

export function queryIsBulletListActive() {
  return (state: EditorState) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes['listItem'], [
      schema.nodes['bulletList'],
    ])(state);
  };
}

export function queryIsTodoListActive() {
  return (state: EditorState) => {
    const { schema } = state;

    return (
      parentHasDirectParentOfType(schema.nodes['listItem'], [
        schema.nodes['bulletList'],
      ])(state) && isNodeTodo(state.selection.$from.node(-1), schema)
    );
  };
}
