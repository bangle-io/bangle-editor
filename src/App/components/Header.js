import React from 'react';
import localforage from 'localforage';
import { MenuBar } from './menu';
import { TransactionContext } from 'Utils/bangle-utils/helper-react/editor-context';

export class Header extends React.PureComponent {
  static contextType = TransactionContext;

  onSave = async () => {
    if (!this.context.editor) {
      throw new Error('No editor');
    }

    const dump = this.context.editor.getJSON();
    await localforage.setItem(
      getFileTitle(dump),
      JSON.stringify({ time: new Date().getTime(), dump }),
    );
    this.props.toggleSidebar(false);
  };

  render() {
    return (
      <header className="bg-gray-100 pr-64 flex flex-row-reverse items-center">
        {this.context.editor && <MenuBar editor={this.context.editor} />}
        <button className="mx-3" onClick={this.onSave}>
          Save
        </button>
      </header>
    );
  }
}

function getFileTitle(dump) {
  let title = dump.content.find((r) => r.type === 'heading');

  if (!title) {
    throw new Error('need heading to save');
  }
  return title.content.map((r) => r.text).join(':');
}
