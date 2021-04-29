import '@bangle.dev/core/style.css';

import {
  BangleEditor,
  BangleEditorState,
  SpecRegistry,
  components,
} from '@bangle.dev/core';

const { heading, bold } = components;
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
