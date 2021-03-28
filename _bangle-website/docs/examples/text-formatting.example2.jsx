import { subscript } from '@bangle.dev/text-formatting';
import '@bangle.dev/core/style.css';
import { BangleEditor, BangleEditorState } from '@bangle.dev/core';
import { setSelectionAtEnd } from '@bangle.dev/core/core-commands';

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specs: [subscript.spec()],
    plugins: () => [
      subscript.plugins({
        keybindings: { toggleSuperscript: 'Ctrl-s' },
      }),
    ],
    initialValue: `<p>Hello there, let us see some <sup>subscript</sup>!</p>`,
  });

  const editor = new BangleEditor(domNode, { state });
  const { view } = editor;
  // set selection at end to demo the example
  setSelectionAtEnd(view.state.doc)(view.state, view.dispatch);
  return editor;
}
