import {
  Plugin,
  PluginKey,
  EditorState,
  TextSelection,
  Transaction,
} from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { MarkType, Node, Mark } from 'prosemirror-model';
import { toggleMark } from 'prosemirror-commands';
import { Command } from './types';

type PluginState = {
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

const pluginKey = new PluginKey('typeahead-state-plugin');

const plugin = new Plugin({
  key: pluginKey,
  state: {
    init() {
      return createInitialPluginState();
    },
    apply(tr, pluginState, _oldState, state) {
      const meta = tr.getMeta(pluginKey) || {};
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
    },
  },
  view: (editorView) => {
    return {
      update(editorView: EditorView<any>, prevState: EditorState<any>) {
        const pluginState = pluginKey.getState(editorView.state) as PluginState;

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
            state.tr.setMeta(pluginKey, {
              action: 'ITEMS_LIST_UPDATED',
              items: ['hello world', 'pinky bob'],
            }),
          );
        }
      },
    };
  },
});

export const typeaheadStatePlugin = {
  plugin,
  pluginKey,
  getState: (editorState: EditorState): PluginState | undefined => {
    return plugin.getState(editorState);
  },
};

const dismissCommand = (): Command => (state, dispatch) => {
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

  const { typeAheadHandler } = pluginKey.getState(state);
  if (typeAheadHandler && typeAheadHandler.dismiss) {
    typeAheadHandler.dismiss(state);
  }

  if (dispatch) {
    dispatch(
      state.tr.removeMark(start, end, markType).removeStoredMark(markType),
    );
  }
  return true;
};

function findTypeAheadQuery(state: EditorState) {
  const { doc, schema } = state;
  const { typeAheadQuery } = schema.marks;
  const { from, to } = state.selection;
  return findQueryMark(typeAheadQuery, doc, from - 1, to);
}

function findQueryMark(mark: MarkType, doc: Node, from: number, to: number) {
  let queryMark = { start: -1, end: -1 };
  doc.nodesBetween(from, to, (node, pos) => {
    if (queryMark.start === -1 && mark.isInSet(node.marks)) {
      queryMark = {
        start: pos,
        end: pos + Math.max(node.textContent.length, 1),
      };
    }
  });

  return queryMark;
}

function itemsListUpdatedActionHandler({
  dispatch,
  pluginState,
  tr,
}): PluginState {
  const items = tr.getMeta(pluginKey).items;
  const newPluginState = {
    ...pluginState,
    items,
    itemsLoader: null,
    currentIndex:
      pluginState.currentIndex > items.length ? 0 : pluginState.currentIndex,
  };
  dispatch(pluginKey, newPluginState); // In atlassian they have to use bunch of places to keep things updated,
  // this dispatch triggers update to anyone (UI components) and they will render
  return newPluginState;
}

function createInitialPluginState(
  prevActiveState = false,
  isAllowed = true,
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
    downKeyCount: 0,
  };
}

function defaultActionHandler({
  pluginState,
  state,
  tr,
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
      isAllowed,
    );
    return newPluginState;
  }

  const { nodeBefore } = selection.$from;

  if (!isActive || !nodeBefore || !pluginState) {
    const newPluginState = createInitialPluginState(
      pluginState ? pluginState.active : false,
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
    '',
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
    downKeyCount: 0,
  };

  return newPluginState;
}

function isQueryActive(mark: MarkType, doc: Node, from: number, to: number) {
  let active = false;

  doc.nodesBetween(from, to, (node) => {
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
function isMarkTypeAllowedInCurrentSelection(
  markType: MarkType,
  state: EditorState,
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

    state.doc.nodesBetween($from.pos, $to.pos, (node) => {
      allowedInActiveMarks =
        allowedInActiveMarks && node.marks.every(isCompatibleMarkType);
    });

    return allowedInActiveMarks;
  });
}

function isMarkTypeAllowedInNode(
  markType: MarkType,
  state: EditorState,
): boolean {
  return toggleMark(markType)(state);
}

function isMarkTypeCompatibleWithMark(markType: MarkType, mark: Mark): boolean {
  return !mark.type.excludes(markType) && !markType.excludes(mark.type);
}
