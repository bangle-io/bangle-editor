import React from 'react';
import Tooltip from './Tooltip';
import { logging } from 'bangle-utils';
import inputRulePlugin, { typeAheadPluginKey } from './type-ahead';
import { EditorView } from 'prosemirror-view';
import { Plugin, EditorState } from 'prosemirror-state';
import { MarkType, Node } from 'prosemirror-model';
import { Command } from './types';

export default class Main extends React.PureComponent<{
  addPlugins: (a: Array<any>) => void;
}> {
  state = {
    coords: undefined,
    text: undefined
  };
  constructor(props) {
    super(props);
    this.props.addPlugins([
      ({ schema }) => inputRulePlugin(schema, [{ trigger: '/' }]),
      () => createMyPlugin()
    ]);
  }

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
      <Tooltip
        addPlugins={this.props.addPlugins}
        coords={this.state.coords}
        text={this.state.text}
      />
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

function createMyPlugin() {
  const pluginState = {
    init() {
      const state: PluginState = {
        isAllowed: true,
        active: false,
        prevActiveState: false,
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
      return state;
    },
    apply(tr, pluginState, _oldState, state) {
      const meta = tr.getMeta(typeAheadPluginKey) || {};
      const { action, params } = meta;
      switch (action) {
        // case 'ITEMS_LIST_UPDATED':
        //   return itemsListUpdatedActionHandler({ dispatch, pluginState, tr });
        default: {
          return pluginState;
        }
      }
    }
  };

  const view = editorView => {
    return {
      update(editorView: EditorView<any>, prevState: EditorState<any>) {
        const pluginState = typeAheadPluginKey.getState(
          editorView.state
        ) as PluginState;

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
            state.tr.setMeta(typeAheadPluginKey, {
              action: 'ITEMS_LIST_UPDATED',
              items: ['hello world', 'pinky bob']
            })
          );
        }
      }
    };
  };

  return new Plugin({
    key: typeAheadPluginKey,
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
