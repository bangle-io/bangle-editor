import React from 'react';
import localforage from 'localforage';
import { MenuBar } from './menu';
import { TransactionContext } from 'Utils/bangle-utils/helper-react/editor-context';
import { localManager } from 'App/store/local';

export class Header extends React.PureComponent {
  static contextType = TransactionContext;
  lastSaved = null;

  onSave = async () => {
    console.log('starting save');
    if (!this.context.editor) {
      throw new Error('No editor');
    }

    if (this.lastSaved && this.context.editor.state.doc === this.lastSaved) {
      console.log('already saved');
      return;
    }

    const content = this.context.editor.getJSON();

    console.log('saving');
    localManager.saveEntry({
      ...this.props.entry,
      content,
      title: getFileTitle(content),
    });

    this.lastSaved = this.context.editor.state.doc;
  };

  componentDidUpdate() {
    this.context.editor && this.onSave();
  }

  render() {
    return (
      <header className="bg-gray-100 pr-64 flex flex-row-reverse items-center  shadow-lg">
        {this.context.editor && <MenuBar editor={this.context.editor} />}
      </header>
    );
  }
}

function getFileTitle(dump) {
  let title = dump.content.find((r) => r.type === 'heading');

  if (!title || !Array.isArray(title.content)) {
    return false;
  }
  return title.content.map((r) => r.text).join(':');
}
