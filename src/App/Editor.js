import React from 'react';

import Dinos from 'Plugins/dinos';
import Emoji from 'Plugins/emoji';

import { History } from 'Utils/bangle-utils/extensions';
import {
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
} from 'Utils/bangle-utils/marks';
import {
  Blockquote,
  BulletList,
  CodeBlock,
  HardBreak,
  Heading,
  HorizontalRule,
  ListItem,
  OrderedList,
  TodoItem,
  TodoList,
} from 'Utils/bangle-utils/nodes';
import { MenuBar } from './components/menu/index';
import { ReactEditor } from 'Utils/bangle-utils/helper-react/react-editor';

export class Editor extends React.Component {
  editorOptions = {
    grabEditor: (editor) => {
      this.props.onEditorReady(editor);
    },
    onUpdate: (...args) => {
      this.props.onEditorUpdate(...args);
    },
    headerComponent: (editor) => <MenuBar editor={editor} />,
    extensions: [
      new Bold(),
      new Code(),
      new Italic(),
      new Link(),
      new Strike(),
      new Underline(),
      new Blockquote(),
      new BulletList(),
      new CodeBlock(),
      new HardBreak(),
      new Heading({
        levels: [1, 2, 3],
      }),
      new HorizontalRule(),
      new ListItem(),
      new TodoItem(),
      new TodoList(),
      new OrderedList(),
      new Dinos(),
      new Emoji(),
      // menuExtension,
      new History(),
    ],
    editorProps: {
      attributes: { class: 'bangle-editor content' },
    },
    content: `
        <h2>
          Hi there,
        </h2>
        <p>
          this is a very <em>basic</em> example of bangle. 
          <span data-type="emoji" data-emojikind=":handball_tone4:‍♀️"></span>
          <span data-type="emoji" data-emojikind=":bug:"></span>
        </p>
        <ul data-type="todo_list">
          <li data-type="todo_item" data-done="false">
            <span class="todo-checkbox" contenteditable="false"></span>
            <div class="todo-content">
              <p>This is a checkbox
              <span data-type="emoji" data-emojikind=":mrs_claus_tone2:"></span>
              </p>
            </div>
          </li>
        </ul>
        <pre><code>body { display: none; }</code></pre>
        <ul>
          <li>
            A regular list
          </li>
          <li>
            With regular items
          </li>
        </ul>
        <blockquote>
          It's amazing 👏
          <br />
          – mom
        </blockquote>

        ${Array.from(
          { length: 40 },
          (_, k) => `
      <p>
        this is a very <em>basic</em> example of bangle. 
        <span data-type="emoji" data-emojikind=":handball_tone4:‍♀️"></span>
        <span data-type="emoji" data-emojikind=":bug:"></span>
      </p>
      `,
        ).join('\n')}
      `,
  };

  render() {
    return (
      <div className="flex justify-center flex-row">
        <div className="flex-1 max-w-screen-lg ml-6 mr-6">
          <ReactEditor options={this.editorOptions} />
        </div>
      </div>
    );
  }
}
