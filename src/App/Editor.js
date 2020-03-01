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
import { ReactEditor } from 'Utils/bangle-utils/helper-react/react-editor';

export class Editor extends React.PureComponent {
  options = {
    devtools: true,
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
      new History(),
    ],
    editorProps: {
      attributes: { class: 'bangle-editor content' },
    },
  };

  render() {
    return (
      <div className="flex justify-center flex-row">
        <div className="flex-1 max-w-screen-lg ml-6 mr-6">
          <ReactEditor
            options={this.options}
            content={this.props.entry.content}
          />
        </div>
      </div>
    );
  }
}
