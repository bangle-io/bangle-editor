import '@banglejs/core/style.css';

import {
  BangleEditor,
  BangleEditorState,
  SpecRegistry,
  heading,
  bold,
} from '@banglejs/core';

export default function createEditor(
  domNode = document.getElementById('#editor'),
) {
  const specRegistry = new SpecRegistry([
    heading.spec({ levels: [1, 2] }),
    bold.spec(),
  ]);

  const plugins = [heading.plugins(), bold.plugins()];

  const state = new BangleEditorState({
    specRegistry,
    plugins,
    initialValue: `Hello world`,
  });
  const editor = new BangleEditor(domNode, { state });

  // Voila! your editor is ready for action
  return editor;
}
