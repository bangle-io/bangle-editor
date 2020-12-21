import '@bangle.dev/core/style.css';

import { BangleEditor, BangleEditorState } from '@bangle.dev/core';
import {
  todoList,
  todoItem,
  listItem,
  bulletList,
  orderedList,
} from '@bangle.dev/core';

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specs: [
      listItem.spec(),
      orderedList.spec(),
      bulletList.spec(),
      // The above list specs are needed
      // for todo lists to work
      todoItem.spec(),
      todoList.spec(),
    ],
    plugins: [
      listItem.plugins(),
      orderedList.plugins(),
      bulletList.plugins(),
      todoItem.plugins(),
      todoList.plugins(),
    ],
    initialValue: `<div>
    <p>Let us check off some lists:</p>
    <ul data-bangle-name="todoList">
        <li data-bangle-name="todoItem">Buy milk</li>
        <li data-bangle-name="todoItem">Clean the room</li>
        <li data-bangle-name="todoItem">Star bangle.dev on Github</li>
    </ul>
    </div>`,
  });

  const editor = new BangleEditor(domNode, { state });

  return editor;
}
