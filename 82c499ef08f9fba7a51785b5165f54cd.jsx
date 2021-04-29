import '@bangle.dev/core/style.css';

import { BangleEditor, BangleEditorState, components } from '@bangle.dev/core';

const { listItem, bulletList, orderedList } = components;

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specs: [
      listItem.spec(),
      orderedList.spec(),
      bulletList.spec(),
      // The above list specs are needed
      // for todo lists to work
    ],
    plugins: () => [
      listItem.plugins(),
      orderedList.plugins(),
      bulletList.plugins(),
    ],
    initialValue: `<div>
    <p>Let us check off some lists:</p>
    <ul>
      <li data-bangle-name="listItem" data-bangle-attrs="{&quot;todoChecked&quot;:false}"><p>Buy milk</p></li>
      <li data-bangle-name="listItem" data-bangle-attrs="{&quot;todoChecked&quot;:false}"><p>Clean the room</p></li>
      <li data-bangle-name="listItem" data-bangle-attrs="{&quot;todoChecked&quot;:false}"><p>Star bangle.dev on Github</p></li>
    </ul>
    </div>`,
  });

  const editor = new BangleEditor(domNode, { state });

  return editor;
}
