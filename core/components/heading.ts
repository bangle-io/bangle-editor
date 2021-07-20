import {
  Command,
  EditorState,
  Fragment,
  keymap,
  Node,
  Schema,
  setBlockType,
  textblockTypeInputRule,
  TextSelection,
} from '@bangle.dev/pm';
import {
  ContentNodeWithPos,
  filter,
  findChildren,
  findParentNodeOfType,
  insertEmpty,
} from '@bangle.dev/utils';
import type Token from 'markdown-it/lib/token';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import {
  copyEmptyCommand,
  cutEmptyCommand,
  jumpToEndOfNode,
  jumpToStartOfNode,
  moveNode,
} from '../core-commands';
import { RawSpecs } from '../spec-registry';
import browser from '../utils/browser';
import { RawPlugins } from '../utils/plugin-loader';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleHeading,
  queryIsHeadingActive,
};

interface OptionsType {
  levels: Array<number>;
}
export const defaultKeys: { [index: string]: string } = {
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
  jumpToStartOfHeading: browser.mac ? 'Ctrl-a' : 'Ctrl-Home',
  jumpToEndOfHeading: browser.mac ? 'Ctrl-e' : 'Ctrl-End',
  insertEmptyParaBelow: 'Mod-Enter',
  // toggleCollapse: null,
};

const name = 'heading';
const defaultLevels = [1, 2, 3, 4, 5, 6];
const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

const checkIsInHeading = (state: EditorState) => {
  const type = getTypeFromSchema(state.schema);
  return findParentNodeOfType(type)(state.selection);
};
const parseLevel = (levelStr: string | number) => {
  const level = parseInt(levelStr as string, 10);
  return Number.isNaN(level) ? undefined : level;
};
function specFactory({ levels = defaultLevels } = {}): RawSpecs {
  if (levels.some((r) => typeof r !== 'number')) {
    throw new Error('levels must be number');
  }

  const options: OptionsType = {
    levels,
  };

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
          getAttrs: (dom: any) => {
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
      toDOM: (node: Node) => {
        const result: any = [`h${node.attrs.level}`, {}, 0];

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
      toMarkdown(state: MarkdownSerializerState, node: Node) {
        state.write(state.repeat('#', node.attrs.level) + ' ');
        state.renderInline(node);
        state.closeBlock(node);
      },
      parseMarkdown: {
        heading: {
          block: name,
          getAttrs: (tok: Token) => {
            return { level: parseLevel(tok.tag.slice(1)) };
          },
        },
      },
    },
    options,
  };
}

function pluginsFactory({
  markdownShortcut = true,
  keybindings = defaultKeys,
} = {}): RawPlugins {
  return ({ schema, specRegistry }) => {
    const { levels }: OptionsType = specRegistry.options[name];
    const type = getTypeFromSchema(schema);

    const levelBindings = Object.fromEntries(
      levels.map((level: number) => [
        keybindings[`toH${level}` as keyof typeof defaultKeys],
        setBlockType(type, { level }),
      ]),
    );
    return [
      keybindings &&
        keymap({
          ...levelBindings,
          [keybindings.moveUp]: moveNode(type, 'UP'),
          [keybindings.moveDown]: moveNode(type, 'DOWN'),
          [keybindings.jumpToStartOfHeading]: jumpToStartOfNode(type),
          [keybindings.jumpToEndOfHeading]: jumpToEndOfNode(type),

          [keybindings.emptyCopy]: copyEmptyCommand(type),
          [keybindings.emptyCut]: cutEmptyCommand(type),

          [keybindings.insertEmptyParaAbove]: insertEmptyParaAbove(),
          [keybindings.insertEmptyParaBelow]: insertEmptyParaBelow(),
          // [keybindings.toggleCollapse]: toggleHeadingCollapse(),
        }),
      ...(markdownShortcut ? levels : []).map((level: number) =>
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

export function toggleHeading(level = 3): Command {
  return (state, dispatch) => {
    if (queryIsHeadingActive(level)(state)) {
      return setBlockType(state.schema.nodes.paragraph)(state, dispatch);
    }
    return setBlockType(state.schema.nodes[name], { level })(state, dispatch);
  };
}

export function queryIsHeadingActive(level: number) {
  return (state: EditorState) => {
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
  return (state: EditorState) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );

    if (!match || !isCollapsible(match)) {
      return false;
    }

    return Boolean(match.node.attrs.collapseContent);
  };
}

export function collapseHeading(): Command {
  return (state, dispatch) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );

    if (!match || !isCollapsible(match)) {
      return false;
    }

    const isCollapsed = queryIsCollapseActive()(state);

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

export function uncollapseHeading(): Command {
  return (state, dispatch) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );

    if (!match || !isCollapsible(match)) {
      return false;
    }

    const isCollapsed = queryIsCollapseActive()(state);

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

export function insertEmptyParaAbove() {
  return filter(checkIsInHeading, (state, dispatch, view) => {
    return insertEmpty(state.schema.nodes.paragraph, 'above', false)(
      state,
      dispatch,
      view,
    );
  });
}

export function insertEmptyParaBelow() {
  return filter(checkIsInHeading, (state, dispatch, view) => {
    return insertEmpty(state.schema.nodes.paragraph, 'below', false)(
      state,
      dispatch,
      view,
    );
  });
}

export function toggleHeadingCollapse(): Command {
  return (state, dispatch) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );

    if (!match || match.depth !== 1) {
      return false;
    }

    const isCollapsed = queryIsCollapseActive()(state);

    return isCollapsed
      ? uncollapseHeading()(state, dispatch)
      : collapseHeading()(state, dispatch);
  };
}

export function uncollapseAllHeadings(): Command {
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

export function listCollapsedHeading(state: EditorState) {
  return findChildren(
    state.doc,
    (node) =>
      node.type === state.schema.nodes[name] &&
      Boolean(node.attrs.collapseContent),
    false,
  );
}

export function listCollapsibleHeading(state: EditorState) {
  return findChildren(
    state.doc,
    (node) => node.type === state.schema.nodes[name],
    false,
  );
}

interface JSONObject {
  [key: string]: any;
}

export const flattenFragmentJSON = (fragJSON: JSONObject[]) => {
  let result: JSONObject[] = [];
  fragJSON.forEach((nodeJSON: JSONObject) => {
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
function isCollapsible(match: ContentNodeWithPos) {
  if (match.depth !== 1) {
    return false;
  }
  return true;
}

function findCollapseFragment(matchNode: Node, doc: Node) {
  // Find the last child that will be inside of the collapse
  let start: { index: number; offset: number; node: Node } | undefined =
    undefined;
  let end: { index: number; offset: number; node: Node } | undefined =
    undefined;
  let isDone = false;

  const breakCriteria = (node: Node) => {
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
    start!.offset + start!.node.nodeSize,
    // @ts-ignore end was incorrectly inferred as "never" here
    end.offset + end.node.nodeSize,
  );

  return {
    fragment: slice.content,
    start: start!.offset,
    // @ts-ignore end was incorrectly inferred as "never" here
    end: end.offset + end.node.nodeSize,
  };
}
