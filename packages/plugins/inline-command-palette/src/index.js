import Tooltip from './Tooltip';
import typeaheadInputRulePlugin from './input-plugin';
import { WithPlugin as WithPlugins } from './helpers/watch-plugin-state-change';
import { StatePlugin2, statePlugin2GetState } from './state-plugin';
import keymapPlugin from './keymaps';

const initialState = {};

export default WithPlugins(
  [
    keymapPlugin(),
    ({ schema }) => typeaheadInputRulePlugin(schema, '@'),
    StatePlugin2(),
  ],
  (prev = initialState, editor) => {
    if (!editor) {
      return initialState;
    }
    const { view, editorState } = editor;
    const statePluginData = statePlugin2GetState(editorState);
    if (!statePluginData) {
      return prev;
    }
    const coords =
      statePluginData.queryMarkPos &&
      view.coordsAtPos(statePluginData.queryMarkPos);

    return {
      coords,
      active: statePluginData.active,
      text: statePluginData.query,
      index: statePluginData.index,
    };
  },
)(Tooltip);
