import React from 'react';

import Dinos from 'plugins/dinos';
import Emoji from 'plugins/emoji';

import { History } from 'utils/bangle-utils/extensions';
import {
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
} from 'utils/bangle-utils/marks';
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
} from 'utils/bangle-utils/nodes';
import { ReactEditor } from 'utils/bangle-utils/helper-react/react-editor';

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
        <div className="flex-1 max-w-screen-md ml-6 mr-6">
          <ReactEditor
            options={this.options}
            content={this.props.entry.content}
          />
        </div>
      </div>
    );
  }
}
