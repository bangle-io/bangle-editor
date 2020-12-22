import { superscript, subscript } from '@bangle.dev/text-formatting';
import '@bangle.dev/core/style.css';
import { BangleEditor, BangleEditorState } from '@bangle.dev/core';
import { setSelectionAtEnd } from '@bangle.dev/core/core-commands';

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specs: [superscript.spec(), subscript.spec()],
    plugins: [
      superscript.plugins({
        keybindings: { toggleSuperscript: 'Ctrl-s' },
      }),
      subscript.plugins({
        keybindings: { toggleSubscript: 'Ctrl-d' },
      }),
    ],
    initialValue: `<p>Hello there, let us see some <sup>superscript</sup> & <sub>subscript</sub>!</p>`,
  });

  const editor = new BangleEditor(domNode, { state });
  const { view } = editor;
  // set selection at end to demo the example
  setSelectionAtEnd(view.state.doc)(view.state, view.dispatch);
  return editor;
}
