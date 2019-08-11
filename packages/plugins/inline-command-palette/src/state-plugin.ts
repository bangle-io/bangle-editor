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
import { isQueryActive, findTypeAheadQuery } from './helpers/query';
import { removeTypeAheadMark } from './commands';
import { DOWN, UP } from './actions';

type StatePluginState = {
  active: boolean;
  query: string | null;
  queryMarkPos: number | null;
  index: number;
};

export const StatePlugin2Key = new PluginKey<StatePluginState>(
  'typeahead-state-plugin',
);

const initialState = {
  active: false,
  query: null,
  queryMarkPos: null,
  index: 0,
};

export function statePlugin2GetState(
  editorState: EditorState,
): StatePluginState {
  return StatePlugin2Key.getState(editorState);
}

export function StatePlugin2() {
  return new Plugin<StatePluginState>({
    key: StatePlugin2Key,
    state: {
      init: () => initialState,
      apply(tr, pluginState, _oldState, newEditorState) {
        const meta = tr.getMeta(StatePlugin2Key) || {};
        const { action, params } = meta;

        switch (action) {
          case DOWN: {
            return {
              ...pluginState,
              index: pluginState.index + 1,
            };
          }
          case UP: {
            return {
              ...pluginState,
              index: pluginState.index - 1,
            };
          }
          default: {
            return defaultActionHandler(newEditorState, pluginState);
          }
        }
      },
    },
    view() {
      return {
        update: (editorView, prevEditorState) => {
          const pluginState = this.key.getState(editorView.state);
          if (!pluginState.active) {
            removeTypeAheadMark()(editorView.state, editorView.dispatch);
            return;
          }
        },
      };
    },
  });
}

function defaultActionHandler(
  editorState: EditorState,
  pluginState: StatePluginState,
): StatePluginState {
  const { typeAheadQuery } = editorState.schema.marks;
  const { doc, selection } = editorState;
  const { from, to } = selection;
  const isActive = isQueryActive(typeAheadQuery, doc, from - 1, to);

  const { nodeBefore } = selection.$from;

  if (!isActive || !nodeBefore) {
    return initialState;
  }

  const typeAheadMark = typeAheadQuery.isInSet(nodeBefore.marks || []);
  const textContent = nodeBefore.textContent || '';
  const trigger = typeAheadMark.attrs.trigger;
  const query = textContent
    .replace(/^([^\x00-\xFF]|[\s\n])+/g, '')
    .replace(trigger, '');

  const queryMark = findTypeAheadQuery(editorState);
  return {
    ...pluginState,
    active: isActive,
    query,
    queryMarkPos: queryMark !== null ? queryMark.start : null,
  };
}
