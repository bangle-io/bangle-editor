import { keymap } from 'prosemirror-keymap';
import { InputRule, wrappingInputRule } from 'prosemirror-inputrules';
import { parentHasDirectParentOfType } from '../core-commands';
import { isNodeTodo, toggleList } from './list-item/commands';
import { chainCommands } from 'prosemirror-commands';
import { filter } from '../utils/index';
import { canJoin, findWrapping } from 'prosemirror-transform';

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

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      content: 'listItem+',
      group: 'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM: () => ['ul', 0],
    },
    markdown: {
      toMarkdown(state, node) {
        state.renderList(node, '  ', () => '- ');
      },
      parseMarkdown: {
        bullet_list: {
          block: name,
        },
      },
    },
  };
}

function pluginsFactory({
  markdownShortcut = true,
  todoMarkdownShortcut = true,
  keybindings = defaultKeys,
} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      keybindings &&
        keymap({
          [keybindings.toggle]: toggleBulletList(),
          [keybindings.toggleTodo]: toggleTodoList(),
        }),
      markdownShortcut &&
        wrappingInputRule(/^\s*([-+*])\s$/, type, undefined, (str, node) => {
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

export function toggleBulletList() {
  const handleTodos = filter(
    [isSelectionParentBulletList, (state) => todoCount(state).todos !== 0],
    (state, dispatch) => {
      const { selection } = state;
      let tr = state.tr;
      smartNodesBetween(selection.$from, selection.$to, tr.doc, (node, pos) => {
        if (
          node.type.name === 'listItem' &&
          typeof node.attrs.todoChecked === 'boolean'
        ) {
          tr = tr.setNodeMarkup(
            pos,
            undefined,
            Object.assign({}, node.attrs, { todoChecked: null }),
          );
        }
      });

      if (dispatch) {
        dispatch(tr);
      }

      return true;
    },
  );

  const handleBulletLists = (state, dispatch, view) =>
    toggleList(state.schema.nodes.bulletList, state.schema.nodes.listItem)(
      state,
      dispatch,
      view,
    );

  return chainCommands(handleTodos, handleBulletLists);
}

const isSelectionParentBulletList = (state) => {
  const { selection } = state;
  const fromNode = selection.$from.node(-2);
  const endNode = selection.$to.node(-2);

  return (
    fromNode &&
    fromNode.type === state.schema.nodes.bulletList &&
    endNode &&
    endNode.type === state.schema.nodes.bulletList
  );
};

export function toggleTodoList() {
  // The job of the command below is to see if the selection
  // has some todo list-items, if yes, convert all list-items
  // to todo.
  const handleTodos = filter(
    [
      isSelectionParentBulletList,
      (state) => {
        const { todos, lists } = todoCount(state);
        // If all the list items are todo or none of them are todo
        // return false so we can run the vanilla toggleList
        return todos !== lists;
      },
    ],
    (state, dispatch) => {
      let { tr, selection } = state;

      smartNodesBetween(
        selection.$from,
        selection.$to,
        state.tr.doc,
        (node, pos) => {
          if (node.type.name === 'listItem' && node.attrs.todoChecked == null) {
            tr = tr.setNodeMarkup(
              pos,
              undefined,
              Object.assign({}, node.attrs, { todoChecked: false }),
            );
          }
        },
      );

      if (dispatch) {
        dispatch(tr);
      }

      return true;
    },
  );

  const fallback = (state, dispatch, view) =>
    toggleList(
      state.schema.nodes.bulletList,
      state.schema.nodes.listItem,
      true,
    )(state, dispatch, view);

  return chainCommands(handleTodos, fallback);
}

export function queryIsBulletListActive() {
  return (state) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes['listItem'], [
      schema.nodes['bulletList'],
    ])(state);
  };
}

export function queryIsTodoListActive() {
  return (state) => {
    const { schema } = state;

    return (
      parentHasDirectParentOfType(schema.nodes['listItem'], [
        schema.nodes['bulletList'],
      ])(state) &&
      typeof state.selection.$from.node(-1).attrs.todoChecked === 'boolean'
    );
  };
}

/**
 * given a bullet/ordered list it will call callback for each node
 *  which
 *    - strictly lies inside the range provided
 *    - nodes that are sibblings of the top level nodes
 *      which lie in the range.
 *
 * Example
 *         <ul>
 *              <li>[A
 *                 <list-A's kids/>
 *              </li>
 *              <li><B]></li>
 *              <li><C></li>
 *              <li>D <list-D's kids </li>
 *           </ul>
 *
 * In the above the callback will be called for everyone
 *  A, list-A's kids, B, C, D _but_ not list-D's kids.
 */
export function smartNodesBetween($from, $to, doc, callback) {
  const start = $from.start(-2);
  const end = $to.end(-2);
  const depth = Math.min(doc.resolve(start).depth, doc.resolve(end).depth);

  doc.nodesBetween(start, end, (node, pos) => {
    if (pos >= start) {
      callback(node, pos);
    }

    // prevent return false for nodes higher in depth
    // as we want to recurse in their kids.
    if (doc.resolve(pos).depth <= depth) {
      return;
    }
    // do not dig deeper into children of nodes outside of selection
    if (pos < $from.pos) {
      return false;
    }
    if (pos > $to.pos) {
      return false;
    }
  });
}

function todoCount(state) {
  let lists = 0;
  let todos = 0;
  const { selection } = state;

  smartNodesBetween(selection.$from, selection.$to, state.doc, (node, pos) => {
    if (node.type.name === 'listItem') {
      lists++;
      if (typeof node.attrs.todoChecked === 'boolean') {
        todos++;
      }
    }
  });

  return {
    lists: lists,
    todos: todos,
  };
}

// Alteration of PM's wrappingInputRule
function wrappingInputRuleForTodo(regexp, getAttrs) {
  return new InputRule(regexp, function (state, match, start, end) {
    const nodeType = state.schema.nodes.listItem;
    var attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    var tr = state.tr.delete(start, end);
    var $start = tr.doc.resolve(start),
      range = $start.blockRange(),
      wrapping = range && findWrapping(range, nodeType, attrs);
    if (!wrapping) {
      return null;
    }
    tr.wrap(range, wrapping);
    var before = tr.doc.resolve(start - 1).nodeBefore;
    if (
      before &&
      before.type === state.schema.nodes.bulletList &&
      canJoin(tr.doc, start - 1) &&
      before.lastChild &&
      isNodeTodo(before.lastChild, state.schema)
    ) {
      tr.join(start - 1);
    }
    return tr;
  });
}
