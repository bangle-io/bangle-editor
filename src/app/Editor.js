import React from 'react';

import Dinos from '../../src/plugins/dinos/index';
import Emoji from '../../src/plugins/emoji/index';
import { History } from '../../src/utils/bangle-utils/extensions/index';
import {
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
} from '../../src/utils/bangle-utils/marks/index';
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
} from '../../src/utils/bangle-utils/nodes/index';
import { ReactEditor } from '../../src/utils/bangle-utils/helper-react/react-editor';

const DEBUG = true;

export class Editor extends React.PureComponent {
  options = {
    id: 'bangle-play-react-editor',
    devtools: process.env.JEST_INTEGRATION || DEBUG,
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
