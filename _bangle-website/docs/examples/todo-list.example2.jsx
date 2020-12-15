import '@banglejs/core/style.css';

import { BangleEditor, BangleEditorState } from '@banglejs/core';
import { listItem, bulletList, orderedList } from '@banglejs/core';

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specs: [listItem.spec(), orderedList.spec(), bulletList.spec()],
    plugins: [listItem.plugins(), orderedList.plugins(), bulletList.plugins()],
    initialValue: `<div>
    <p>We also have unordered lists:</p>
    <ul>
        <li>Buy milk</li>
        <li>Clean the room</li>
        <li>Star BangleJS on Github</li>
    </ul>
    <p>And ofcourse ordered lists:</p>
    <ol>
        <li>Buy milk</li>
        <li>Clean the room</li>
        <li>Star BangleJS on Github</li>
    </ol>
    </div>`,
  });

  const editor = new BangleEditor(domNode, { state });

  return editor;
}
