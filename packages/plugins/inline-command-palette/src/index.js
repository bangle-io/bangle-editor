import Tooltip from './Tooltip';
import { withEditorStateUpdate } from './helpers/with-editor-state-update';
import { typeAheadInputRule } from './type-ahead-input-rule';
import {
  typeAheadStatePlugin,
  typeAheadStatePluginKey,
} from './type-ahead-state-plugin';
import { typeaheadKeymap } from './type-ahead-keymap';

export const commandPalettePlugins = [
  typeaheadKeymap(),
  ({ schema }) => typeAheadInputRule(schema, '/'),
  typeAheadStatePlugin(),
];

export const CommandPalette = withEditorStateUpdate({
  initialState: {},
  transformEditorState: (state, editor) => {
    const { view, editorState } = editor;
    const statePluginData = typeAheadStatePluginKey.getState(editorState);

    if (!statePluginData) {
      return state;
    }

    const coords =
      statePluginData.active &&
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
