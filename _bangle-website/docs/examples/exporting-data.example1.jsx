import {
  BangleEditor,
  BangleEditorState,
  corePlugins,
  coreSpec,
  Plugin,
  SpecRegistry,
} from '@bangle.dev/core';
import '@bangle.dev/core/style.css';
import { toHTMLString } from '@bangle.dev/utils';

export default function Editor(domNode) {
  function onEditorDocChange(state) {
    // window.showData is just a quick hacky way
    // to communicate with the documentation backend
    // to show the data in a nice UI. Feel free to modify it
    // to persist things localStorage or some cloud service.
    window.showData &&
      window.showData({
        htmlString: toHTMLString(state),
        json: state.doc.toJSON(),
      });
  }

  const state = new BangleEditorState({
    specRegistry: new SpecRegistry(coreSpec()),
    plugins: () => [
      ...corePlugins(),
      new Plugin({
        view: () => ({
          update: (view, prevState) => {
            if (!view.state.doc.eq(prevState.doc)) {
              onEditorDocChange(view.state);
            }
          },
        }),
      }),
    ],
    initialValue: 'Hey there!',
  });

  const editor = new BangleEditor(domNode, { state });

  // Show initial state
  onEditorDocChange(editor.view.state);

  return editor;
}
