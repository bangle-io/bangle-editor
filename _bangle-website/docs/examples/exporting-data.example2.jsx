import '@bangle.dev/core/style.css';
import {
  Plugin,
  BangleEditor,
  BangleEditorState,
  SpecRegistry,
} from '@bangle.dev/core';
import { corePlugins, coreSpec } from '@bangle.dev/core/utils/core-components';

function getItemFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('exporting-data.example2'));
  } catch (err) {
    return null;
  }
}

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specRegistry: new SpecRegistry(coreSpec()),
    plugins: [
      ...corePlugins(),
      new Plugin({
        view: () => ({
          update: (view, prevState) => {
            if (!view.state.doc.eq(prevState.doc)) {
              localStorage.setItem(
                'exporting-data.example2',
                JSON.stringify(view.state.doc.toJSON()),
              );
            }
          },
        }),
      }),
    ],
    initialValue:
      getItemFromStorage() ||
      'Hey there whatever you type here will be persisted in localStorage!',
  });

  const editor = new BangleEditor(domNode, { state });

  return editor;
}
