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
import { dismissCommand } from './commands';

type StatePluginState = {
  active: boolean;
  query: string | null;
  queryMarkPos: number | null;
};

export const StatePlugin2Key = new PluginKey('typeahead-state-plugin');

const initPlugin = () => ({
  active: false,
  query: null,
  queryMarkPos: null,
});

export function StatePlugin2() {
  return new Plugin<StatePluginState>({
    key: StatePlugin2Key,
    state: {
      init: initPlugin,
      apply(tr, pluginState, _oldState, newEditorState) {
        const meta = tr.getMeta(StatePlugin2Key) || {};
        const { action, params } = meta;

        switch (action) {
          default: {
            return defaultActionHandler(newEditorState);
          }
        }
      },
    },
    view() {
      return {
        update: (editorView, prevEditorState) => {
          const pluginState = this.key.getState(editorView.state);
          if (!pluginState.active) {
            dismissCommand()(editorView.state, editorView.dispatch);
            return;
          }
        },
      };
    },
  });
}

function defaultActionHandler(editorState: EditorState): StatePluginState {
  const { typeAheadQuery } = editorState.schema.marks;
  const { doc, selection } = editorState;
  const { from, to } = selection;
  const isActive = isQueryActive(typeAheadQuery, doc, from - 1, to);

  const { nodeBefore } = selection.$from;

  if (!isActive || !nodeBefore) {
    return initPlugin();
  }

  const typeAheadMark = typeAheadQuery.isInSet(nodeBefore.marks || []);
  const textContent = nodeBefore.textContent || '';
  const trigger = typeAheadMark.attrs.trigger;
  const query = textContent
    .replace(/^([^\x00-\xFF]|[\s\n])+/g, '')
    .replace(trigger, '');

  const queryMark = findTypeAheadQuery(editorState);
  return {
    active: isActive,
    query,
    queryMarkPos: queryMark !== null ? queryMark.start : null,
  };
}
