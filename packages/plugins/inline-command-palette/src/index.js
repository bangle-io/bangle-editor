import Tooltip from './Tooltip';
import typeaheadInputRulePlugin from './input-plugin';
import { withEditorStateUpdate } from './helpers/with-editor-state-update';
import { StatePlugin2, statePlugin2GetState } from './state-plugin';
import keymapPlugin from './keymaps';

export const commandPalettePlugins = [
  keymapPlugin(),
  ({ schema }) => typeaheadInputRulePlugin(schema, '@'),
  StatePlugin2(),
];

export const CommandPalette = withEditorStateUpdate({
  initialState: {},
  transformEditorState: (state, editor) => {
    const { view, editorState } = editor;
    const statePluginData = statePlugin2GetState(editorState);

    if (!statePluginData) {
      return state;
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
})(Tooltip);
