import React from 'react';
import PropTypes from 'prop-types';

import Dinos from '../../bangle-play/plugins/dinos/index';
import Emoji from '../../bangle-play/plugins/emoji/index';
import { History } from 'bangle-core/extensions/index';
import {
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
} from 'bangle-core/marks/index';
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
} from 'bangle-core/nodes/index';
import { ReactEditor } from 'bangle-core/helper-react/react-editor';
import { TrailingNode } from 'bangle-core/addons';
import StopwatchExtension from '../plugins/stopwatch/stopwatch';
import { Manager } from 'bangle-core/collab/server/manager';
import { Editor as PMEditor } from 'bangle-core/editor';
import { Disk } from '../plugins/persistence/disk';
import { defaultContent } from './components/constants';
import { Timestamp } from '../plugins/timestamp';

const DEBUG = true;

export class Editor extends React.PureComponent {
  static propTypes = {
    docNames: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string, docName: PropTypes.string })
        .isRequired,
    ).isRequired,
  };
  devtools = process.env.JEST_INTEGRATION || DEBUG;
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

    const disk = new Disk({
      db: this.props.database,
      defaultDoc: defaultContent,
    });

    this.manager = new Manager(schema, {
      disk,
    });

    // window.addEventListener('beforeunload', (event) => {
    //   disk.myMainDisk.flushAll();
    //   event.returnValue = `Are you sure you want to leave?`;
    // });

    if (this.devtools) {
      window.manager = this.manager;
    }
    dummyEditor.destroy();
  }
  options = (docName, id) => ({
    docName,
    manager: this.manager,
    id,
    devtools: this.devtools,
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
      new Timestamp(),
    ],
    editorProps: {
      attributes: { class: 'bangle-editor content' },
    },
  });

  render() {
    return (
      <div className="flex justify-center flex-row">
        {this.props.docNames.map((obj, i) => (
          <div
            key={obj.key}
            className="flex-1 max-w-screen-md ml-6 mr-6"
            style={{ overflow: 'scroll', height: '90vh' }}
          >
            <ReactEditor
              options={this.options(
                obj.docName,
                'bangle-play-react-editor' + obj.key,
              )}
              content={obj.docName}
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
