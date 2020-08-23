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
import { TrailingNode } from '../utils/bangle-utils/addons';
import StopwatchExtension from '../plugins/stopwatch/stopwatch';
import { Manager } from '../plugins/collab/server/manager';
import { Editor as PMEditor } from '../../src/utils/bangle-utils/editor';

const DEBUG = true;

export class Editor extends React.PureComponent {
  state = {
    docNames: ['ole', 'ole'],
  };
  constructor(props) {
    super(props);

    // todo this is temporary way of getting schema we need better than this
    const dummyEditor = new PMEditor(document.createElement('div'), {
      ...this.options(),
      renderNodeView: () => {},
      destroyNodeView: () => {},
      onInit: () => {},
      manualViewCreate: true,
    });
    const schema = dummyEditor.schema;
    this.manager = new Manager(schema);
    dummyEditor.destroy();
  }
  options = (id) => ({
    id,
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
      new TrailingNode(),
      new StopwatchExtension(),
    ],
    editorProps: {
      attributes: { class: 'bangle-editor content' },
    },
  });

  render() {
    return (
      <div className="flex justify-center flex-row">
        {this.state.docNames.map((docName, i) => (
          <div
            key={i}
            className="flex-1 max-w-screen-md ml-6 mr-6"
            style={{ overflow: 'scroll', height: '90vh' }}
          >
            <ReactEditor
              docName={this.props.docName}
              options={this.options('bangle-play-react-editor' + i)}
              content={this.props.entry.content}
              manager={this.manager}
            />
            {/* adds white space at bottoms */}
            <div
              style={{
                display: 'flex',
                flexGrow: 1,
                height: '25vh',
                backgroundColor: 'transparent',
              }}
            >
              &nbsp;
            </div>
          </div>
        ))}
      </div>
    );
  }
}
