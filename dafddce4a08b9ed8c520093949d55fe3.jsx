import '@bangle.dev/core/style.css';

import { BangleEditor, BangleEditorState, components } from '@bangle.dev/core';

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specs: [components.image.spec()],
    plugins: () => [components.image.plugins()],
    initialValue: `<div><p>Hey there!</p>
        <p>Let us see an image of cat</p>
        <img src="https://media.giphy.com/media/7xkxbhryQO7hm/giphy.gif" />
        <p>Thats not a cat, its Bender!</p>
        </div>`,
  });

  const editor = new BangleEditor(domNode, { state });

  return editor;
}
