import { Plugin, PluginKey } from 'prosemirror-state';

import { isQueryActive, findTypeAheadQuery } from './helpers/query';
import { removeTypeAheadMark } from './commands';
import { DOWN, UP, ENTER } from './actions';

export const typeAheadStatePluginKey = new PluginKey('typeahead-state-plugin');

const initialState = {
  active: false,
  query: null,
  queryMarkPos: null,
  index: 0,
};

export function typeAheadStatePlugin() {
  return new Plugin({
    key: typeAheadStatePluginKey,
    state: {
      init: () => initialState,
      apply(tr, pluginState, oldEditorState, newEditorState) {
        const meta = tr.getMeta(typeAheadStatePluginKey) || {};
        const { action } = meta;
        switch (action) {
          case ENTER: {
            return {
              ...pluginState,
              active: false,
            };
          }
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
            const r = defaultActionHandler(newEditorState, pluginState);
            console.log(r);
            return r;
          }
        }
      },
    },
    view() {
      return {
        update: (editorView, prevEditorState) => {
          console.log('editorview update');
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

function defaultActionHandler(editorState, pluginState) {
  console.log('here default');
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
    // eslint-disable-next-line no-control-regex
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
