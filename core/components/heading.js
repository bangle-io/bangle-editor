import { setBlockType } from 'prosemirror-commands';
import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { findChildren } from 'prosemirror-utils';
import { Fragment } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';

import { keymap } from '../utils/keymap';
import { copyEmptyCommand, cutEmptyCommand, moveNode } from '../core-commands';
import { filter, findParentNodeOfType, insertEmpty } from '../utils/pm-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleHeading,
  queryIsHeadingActive,
};
export const defaultKeys = {
  toH1: 'Shift-Ctrl-1',
  toH2: 'Shift-Ctrl-2',
  toH3: 'Shift-Ctrl-3',
  toH4: 'Shift-Ctrl-4',
  toH5: 'Shift-Ctrl-5',
  toH6: 'Shift-Ctrl-6',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  insertEmptyParaBelow: 'Mod-Enter',
  toggleCollapse: null,
};

const name = 'heading';
const defaultLevels = [1, 2, 3, 4, 5, 6];
const getTypeFromSchema = (schema) => schema.nodes[name];
const parseLevel = (level) => {
  level = parseInt(level, 10);
  return Number.isNaN(level) ? undefined : level;
};
function specFactory({ levels = defaultLevels } = {}) {
  if (levels.some((r) => typeof r !== 'number')) {
    throw new Error('levels must be number');
  }

  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        level: {
          default: 1,
        },
        collapseContent: {
          default: null,
        },
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: levels.map((level) => {
        return {
          tag: `h${level}`,
          getAttrs: (dom) => {
            const result = { level: parseLevel(level) };
            const attrs = dom.getAttribute('data-bangle-attrs');

            if (!attrs) {
              return result;
            }

            const obj = JSON.parse(attrs);

            return Object.assign({}, result, obj);
          },
        };
      }),
      toDOM: (node) => {
        const result = [`h${node.attrs.level}`, {}, 0];

        if (node.attrs.collapseContent) {
          result[1]['data-bangle-attrs'] = JSON.stringify({
            collapseContent: node.attrs.collapseContent,
          });
          result[1]['class'] = 'bangle-heading-collapsed';
        }

        return result;
      },
    },
    markdown: {
      toMarkdown(state, node) {
        state.write(state.repeat('#', node.attrs.level) + ' ');
        state.renderInline(node);
        state.closeBlock(node);
      },
      parseMarkdown: {
        heading: {
          block: name,
          getAttrs: (tok) => {
            return { level: parseLevel(tok.tag.slice(1)) };
          },
        },
      },
    },
    options: {
      levels,
    },
  };
}

function pluginsFactory({
  markdownShortcut = true,
  keybindings = defaultKeys,
} = {}) {
  return ({ schema, specRegistry }) => {
    const { levels } = specRegistry.options[name];
    const type = getTypeFromSchema(schema);
    const isInHeading = (state) => findParentNodeOfType(type)(state.selection);
    const levelBindings = Object.fromEntries(
      levels.map((level) => [
        keybindings[`toH${level}`],
        setBlockType(type, { level }),
      ]),
    );
    return [
      keybindings &&
        keymap({
          ...levelBindings,
          [keybindings.moveUp]: moveNode(type, 'UP'),
          [keybindings.moveDown]: moveNode(type, 'DOWN'),

          [keybindings.emptyCopy]: copyEmptyCommand(type),
          [keybindings.emptyCut]: cutEmptyCommand(type),

          [keybindings.insertEmptyParaAbove]: filter(
            isInHeading,
            insertEmpty(schema.nodes.paragraph, 'above', false),
          ),
          [keybindings.insertEmptyParaBelow]: filter(
            isInHeading,
            insertEmpty(schema.nodes.paragraph, 'below', false),
          ),
          [keybindings.toggleCollapse]: toggleHeadingCollapse(),
        }),
      ...(markdownShortcut ? levels : []).map((level) =>
        textblockTypeInputRule(
          new RegExp(`^(#{1,${level}})\\s$`),
          type,
          () => ({
            level,
          }),
        ),
      ),
    ];
  };
}

export function toggleHeading(level = 3) {
  return (state, dispatch, view) => {
    if (queryIsHeadingActive(level)(state)) {
      return setBlockType(state.schema.nodes.paragraph)(state, dispatch, view);
    }
    return setBlockType(state.schema.nodes[name], { level })(
      state,
      dispatch,
      view,
    );
  };
}

export function queryIsHeadingActive(level) {
  return (state) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );
    if (!match) {
      return false;
    }
    const { node } = match;
    if (level == null) {
      return true;
    }
    return node.attrs.level === level;
  };
}

export function queryIsCollapseActive() {
  return (state) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );

    if (!match || !isCollapsible(match)) {
      return false;
    }

    return Boolean(match.node.attrs.collapseContent);
  };
}

export function collapseHeading() {
  return (state, dispatch) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );

    if (!match || !isCollapsible(match)) {
      return false;
    }

    const isCollapsed = queryIsCollapseActive()(state, dispatch);

    if (isCollapsed) {
      return false;
    }

    const result = findCollapseFragment(match.node, state.doc);

    if (!result) {
      return false;
    }

    const { fragment, start, end } = result;

    let tr = state.tr.replaceWith(
      start,
      end,
      state.schema.nodes[name].createChecked(
        {
          ...match.node.attrs,
          collapseContent: fragment.toJSON(),
        },
        match.node.content,
      ),
    );

    if (state.selection instanceof TextSelection) {
      tr = tr.setSelection(TextSelection.create(tr.doc, state.selection.from));
    }

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
}

export function uncollapseHeading() {
  return (state, dispatch) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );

    if (!match || !isCollapsible(match)) {
      return false;
    }

    const isCollapsed = queryIsCollapseActive()(state, dispatch);

    if (!isCollapsed) {
      return false;
    }

    const frag = Fragment.fromJSON(
      state.schema,
      match.node.attrs.collapseContent,
    );

    let tr = state.tr.replaceWith(
      match.pos,
      match.pos + match.node.nodeSize,
      Fragment.fromArray([
        state.schema.nodes[name].createChecked(
          {
            ...match.node.attrs,
            collapseContent: null,
          },
          match.node.content,
        ),
      ]).append(frag),
    );

    if (state.selection instanceof TextSelection) {
      tr = tr.setSelection(TextSelection.create(tr.doc, state.selection.from));
    }

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
}

export function toggleHeadingCollapse() {
  return (state, dispatch) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );

    if (!match || match.depth !== 1) {
      return null;
    }

    const isCollapsed = queryIsCollapseActive()(state, dispatch);

    return isCollapsed
      ? uncollapseHeading()(state, dispatch)
      : collapseHeading()(state, dispatch);
  };
}

export function uncollapseAllHeadings() {
  return (state, dispatch) => {
    const collapsibleNodes = listCollapsedHeading(state);

    let tr = state.tr;
    let offset = 0;

    for (const { node, pos } of collapsibleNodes) {
      let baseFrag = Fragment.fromJSON(
        state.schema,
        flattenFragmentJSON(node.attrs.collapseContent),
      );

      tr = tr.replaceWith(
        offset + pos,
        offset + pos + node.nodeSize,
        Fragment.fromArray([
          state.schema.nodes[name].createChecked(
            {
              ...node.attrs,
              collapseContent: null,
            },
            node.content,
          ),
        ]).append(baseFrag),
      );

      offset += baseFrag.size;
    }

    if (state.selection instanceof TextSelection) {
      tr = tr.setSelection(TextSelection.create(tr.doc, state.selection.from));
    }

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
}

export function listCollapsedHeading(state) {
  return findChildren(
    state.doc,
    (node) =>
      node.type === state.schema.nodes[name] &&
      Boolean(node.attrs.collapseContent),
    false,
  );
}

export function listCollapsibleHeading(state) {
  return findChildren(
    state.doc,
    (node) => node.type === state.schema.nodes[name],
    false,
  );
}

export const flattenFragmentJSON = (fragJSON) => {
  let result = [];
  fragJSON.forEach((nodeJSON) => {
    if (nodeJSON.type === 'heading' && nodeJSON.attrs.collapseContent) {
      const collapseContent = nodeJSON.attrs.collapseContent;
      result.push({
        ...nodeJSON,
        attrs: {
          ...nodeJSON.attrs,
          collapseContent: null,
        },
      });
      result.push(...flattenFragmentJSON(collapseContent));
    } else {
      result.push(nodeJSON);
    }
  });

  return result;
};

// TODO
/**
 *
 * collapse all headings of given level
 */
// export function collapseHeadings(level) {}

/**
 * Collapsible headings are only allowed at depth of 1
 */
function isCollapsible(match) {
  if (match.depth !== 1) {
    return false;
  }
  return true;
}

function findCollapseFragment(matchNode, doc) {
  // Find the last child that will be inside of the collapse
  let start = undefined;
  let end = undefined;
  let isDone = false;

  const breakCriteria = (node) => {
    if (node.type !== matchNode.type) {
      return false;
    }

    if (node.attrs.level <= matchNode.attrs.level) {
      return true;
    }

    return false;
  };

  doc.forEach((node, offset, index) => {
    if (isDone) {
      return;
    }

    if (node === matchNode) {
      start = { index, offset, node };
      return;
    }

    if (start) {
      if (breakCriteria(node)) {
        isDone = true;
        return;
      }

      // Avoid including trailing empty nodes
      // (like empty paragraphs inserted by trailing-node-plugins)
      // This is done to prevent trailing-node from inserting a new empty node
      // every time we toggle on off the collapse.
      if (node.content.size !== 0) {
        end = { index, offset, node };
      }
    }
  });

  if (!end) {
    return null;
  }

  // We are not adding parents position (doc will be parent always) to
  // the offsets since it will be 0
  const slice = doc.slice(
    start.offset + start.node.nodeSize,
    end.offset + end.node.nodeSize,
  );

  return {
    fragment: slice.content,
    start: start.offset,
    end: end.offset + end.node.nodeSize,
  };
}
