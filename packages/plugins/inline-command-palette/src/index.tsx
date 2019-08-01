import React from 'react';
import Tooltip from './Tooltip';
import { toggleMark } from 'prosemirror-commands';

import { logging } from 'bangle-utils';
import inputRulePlugin, { typeAheadPluginKey } from './type-ahead';
import { EditorView } from 'prosemirror-view';
import {
  Plugin,
  EditorState,
  PluginKey,
  Transaction,
  TextSelection
} from 'prosemirror-state';
import { MarkType, Node, Mark } from 'prosemirror-model';
import { Command } from './types';
import { watchStateChange } from './helpers/watch-plugin-state-change';

export default class Main extends React.PureComponent<{
  addPlugins: (a: Array<any>) => void;
  editorView: EditorView;
}> {
  state = {
    coords: undefined,
    text: undefined,
    show: false
  };
  constructor(props) {
    super(props);
    this.props.addPlugins([
      ({ schema }) => inputRulePlugin(schema, [{ trigger: '/' }]),
      watchStateChange({
        plugin: createMyPlugin(typeAheadPluginKey),
        pluginKey: typeAheadPluginKey,
        onStateInit: this.onPluginStateSetup,
        onStateApply: this.onPluginStateChange
      })
    ]);
  }

  onPluginStateSetup = o => {
    console.log('o', o);
  };

  onPluginStateChange = ({ cur, prev }) => {
    const view = (window as any).view;
    if (cur.active === true) {
      this.setState({
        show: true,
        coords: {
          start: view.coordsAtPos(cur.queryMarkPos),
          end: view.coordsAtPos(cur.queryMarkPos)
        },
        text: cur.query
      });
    }
    if (cur.active === false && prev.active === true) {
      this.setState({
        show: false
      });
    }
  };

  onChange = ({ view, range, text }) => {
    this.setState({
      coords: {
        start: view.coordsAtPos(range.from),
        end: view.coordsAtPos(range.to)
      },
      text
    });

    return false;
  };

  onEnter = ({ view, range, text }) => {
    this.setState({
      coords: {
        start: view.coordsAtPos(range.from),
        end: view.coordsAtPos(range.to)
      },
      text
    });

    return false;
  };

  onExit = ({ view, range, text }) => {
    this.setState({
      coords: undefined,
      text: undefined
    });

    return false;
  };

  render() {
    return (
      this.state.show && (
        <Tooltip
          addPlugins={this.props.addPlugins}
          coords={this.state.coords}
          text={this.state.text}
        />
      )
    );
  }
}

export type PluginState = {
  isAllowed: boolean;
  active: boolean;
  prevActiveState: boolean;
  query: string | null;
  trigger: string | null;
  // typeAheadHandler: TypeAheadHandler | null;
  items: Array<any>;
  // itemsLoader: TypeAheadItemsLoader;
  currentIndex: number;
  queryMarkPos: number | null;
  queryStarted: number;
  upKeyCount: number;
  downKeyCount: number;
  spotlight?: JSX.Element | null;
};

function createMyPlugin(key) {
  const pluginState = {
    init() {
      return createInitialPluginState();
    },
    apply(tr, pluginState, _oldState, state) {
      const meta = tr.getMeta(key) || {};
      const { action, params } = meta;

      // Discovery: All of these (as far as i know atm), will be called from external sources
      //  like JSX or keybord bindings, they would do do a dispatch of tr with metadata action.
      switch (action) {
        // case 'ITEMS_LIST_UPDATED':
        //   return itemsListUpdatedActionHandler({ dispatch, pluginState, tr });
        default: {
          return defaultActionHandler({ pluginState, state, tr });
        }
      }
    }
  };

  const view = editorView => {
    return {
      update(editorView: EditorView<any>, prevState: EditorState<any>) {
        const pluginState = key.getState(editorView.state) as PluginState;

        if (!pluginState) {
          return;
        }

        const { state, dispatch } = editorView;
        const { doc, selection } = state;
        const { from, to } = selection;
        const { typeAheadQuery } = state.schema.marks;

        // Disable type ahead query when removing trigger.
        if (pluginState.active && !pluginState.query && !pluginState.trigger) {
          dismissCommand()(state, dispatch);
          return;
        }

        // Disable type ahead query when the first character is a space.
        if (
          pluginState.active &&
          (pluginState.query || '').indexOf(' ') === 0
        ) {
          dismissCommand()(state, dispatch);
          return;
        }

        // Optimization to not call dismissCommand if plugin is in an inactive state.
        if (
          !pluginState.active &&
          pluginState.prevActiveState &&
          !doc.rangeHasMark(from - 1, to, typeAheadQuery)
        ) {
          dismissCommand()(state, dispatch);
          return;
        }

        // Fetch type ahead items if handler returned a promise.
        // if (pluginState.active && pluginState.itemsLoader) {
        if (pluginState.active && pluginState.items.length == 0) {
          dispatch(
            state.tr.setMeta(key, {
              action: 'ITEMS_LIST_UPDATED',
              items: ['hello world', 'pinky bob']
            })
          );
        }
      }
    };
  };

  return new Plugin({
    key: key,
    state: pluginState,
    view
  });
}

export const dismissCommand = (): Command => (state, dispatch) => {
  const queryMark = findTypeAheadQuery(state);

  if (queryMark === null) {
    return false;
  }

  const { start, end } = queryMark;
  const { schema } = state;
  const markType = schema.marks.typeAheadQuery;
  if (start === -1) {
    return false;
  }

  const { typeAheadHandler } = typeAheadPluginKey.getState(state);
  if (typeAheadHandler && typeAheadHandler.dismiss) {
    typeAheadHandler.dismiss(state);
  }

  if (dispatch) {
    dispatch(
      state.tr.removeMark(start, end, markType).removeStoredMark(markType)
    );
  }
  return true;
};

export function findTypeAheadQuery(state: EditorState) {
  const { doc, schema } = state;
  const { typeAheadQuery } = schema.marks;
  const { from, to } = state.selection;
  return findQueryMark(typeAheadQuery, doc, from - 1, to);
}

export function findQueryMark(
  mark: MarkType,
  doc: Node,
  from: number,
  to: number
) {
  let queryMark = { start: -1, end: -1 };
  doc.nodesBetween(from, to, (node, pos) => {
    if (queryMark.start === -1 && mark.isInSet(node.marks)) {
      queryMark = {
        start: pos,
        end: pos + Math.max(node.textContent.length, 1)
      };
    }
  });

  return queryMark;
}

export function itemsListUpdatedActionHandler({
  dispatch,
  pluginState,
  tr
}): PluginState {
  const items = tr.getMeta(typeAheadPluginKey).items;
  const newPluginState = {
    ...pluginState,
    items,
    itemsLoader: null,
    currentIndex:
      pluginState.currentIndex > items.length ? 0 : pluginState.currentIndex
  };
  dispatch(typeAheadPluginKey, newPluginState); // In atlassian they have to use bunch of places to keep things updated,
  // this dispatch triggers update to anyone (UI components) and they will render
  return newPluginState;
}

export function createInitialPluginState(
  prevActiveState = false,
  isAllowed = true
): PluginState {
  return {
    isAllowed,
    active: false,
    prevActiveState,
    query: null,
    trigger: null,
    // typeAheadHandler: null,
    currentIndex: 0,
    items: [],
    // itemsLoader: null,
    queryMarkPos: null,
    queryStarted: 0,
    upKeyCount: 0,
    downKeyCount: 0
  };
}

function defaultActionHandler({
  pluginState,
  state,
  tr
}: {
  pluginState: PluginState;
  state: EditorState;
  tr: Transaction;
}): PluginState {
  const { typeAheadQuery } = state.schema.marks;
  const { doc, selection } = state;
  const { from, to } = selection;
  const isActive = isQueryActive(typeAheadQuery, doc, from - 1, to);
  const isAllowed = isMarkTypeAllowedInCurrentSelection(typeAheadQuery, state);

  if (!isAllowed && !isActive) {
    const newPluginState = createInitialPluginState(
      pluginState.active,
      isAllowed
    );
    return newPluginState;
  }

  const { nodeBefore } = selection.$from;

  if (!isActive || !nodeBefore || !pluginState) {
    const newPluginState = createInitialPluginState(
      pluginState ? pluginState.active : false
    );
    return newPluginState;
  }

  const typeAheadMark = typeAheadQuery.isInSet(nodeBefore.marks || []);
  if (!typeAheadMark || !typeAheadMark.attrs.trigger) {
    return pluginState;
  }

  const textContent = nodeBefore.textContent || '';
  const trigger = typeAheadMark.attrs.trigger.replace(
    /([^\x00-\xFF]|[\s\n])+/g,
    ''
  );

  // If trigger has been removed, reset plugin state
  if (!textContent.includes(trigger)) {
    const newPluginState = { ...createInitialPluginState(true), active: true };
    return newPluginState;
  }

  const query = textContent
    .replace(/^([^\x00-\xFF]|[\s\n])+/g, '')
    .replace(trigger, '');

  const queryMark = findTypeAheadQuery(state);

  const newPluginState = {
    isAllowed,
    query,
    trigger,
    active: true,
    prevActiveState: pluginState.active,
    items: ['cool dude'],
    // itemsLoader: itemsLoader,
    currentIndex: pluginState.currentIndex,
    queryMarkPos: queryMark !== null ? queryMark.start : null,
    queryStarted: Date.now(),
    upKeyCount: 0,
    downKeyCount: 0
  };

  return newPluginState;
}

export function isQueryActive(
  mark: MarkType,
  doc: Node,
  from: number,
  to: number
) {
  let active = false;

  doc.nodesBetween(from, to, node => {
    if (!active && mark.isInSet(node.marks)) {
      active = true;
    }
  });

  return active;
}

/**
 * Check if a mark is allowed at the current selection / cursor based on a given state.
 * This method looks at both the currently active marks on the transaction, as well as
 * the node and marks at the current selection to determine if the given mark type is
 * allowed.
 */
export function isMarkTypeAllowedInCurrentSelection(
  markType: MarkType,
  state: EditorState
) {
  // if (state.selection instanceof FakeTextCursorSelection) {
  //   return true;
  // }

  if (!isMarkTypeAllowedInNode(markType, state)) {
    return false;
  }

  const { empty, $cursor, ranges } = state.selection as TextSelection;
  if (empty && !$cursor) {
    return false;
  }

  let isCompatibleMarkType = (mark: Mark) =>
    isMarkTypeCompatibleWithMark(markType, mark);

  // Handle any new marks in the current transaction
  if (
    state.tr.storedMarks &&
    !state.tr.storedMarks.every(isCompatibleMarkType)
  ) {
    return false;
  }

  if ($cursor) {
    return $cursor.marks().every(isCompatibleMarkType);
  }

  // Check every node in a selection - ensuring that it is compatible with the current mark type
  return ranges.every(({ $from, $to }) => {
    let allowedInActiveMarks =
      $from.depth === 0 ? state.doc.marks.every(isCompatibleMarkType) : true;

    state.doc.nodesBetween($from.pos, $to.pos, node => {
      allowedInActiveMarks =
        allowedInActiveMarks && node.marks.every(isCompatibleMarkType);
    });

    return allowedInActiveMarks;
  });
}

function isMarkTypeAllowedInNode(
  markType: MarkType,
  state: EditorState
): boolean {
  return toggleMark(markType)(state);
}

function isMarkTypeCompatibleWithMark(markType: MarkType, mark: Mark): boolean {
  return !mark.type.excludes(markType) && !markType.excludes(mark.type);
}
