import React from 'react';
import { MenuBar } from './menu';
import { EditorContext } from '../../utils/bangle-utils/helper-react/editor-context';
import { localManager } from '../../app/store/local';
import debounce from 'lodash.debounce';

export class Header extends React.PureComponent {
  static contextType = EditorContext;
  lastSaved = null;

  onSave = debounce(
    async () => {
      if (!this.context.getEditor()) {
        throw new Error('No editor');
      }

      if (
        this.lastSaved &&
        this.context.getEditor().state.doc === this.lastSaved
      ) {
        console.log('already saved');
        return;
      }

      const content = this.context.getEditor().getJSON();

      console.log('saving');
      localManager.saveEntry({
        ...this.props.entry,
        content,
        title: getFileTitle(content),
      });

      this.lastSaved = this.context.getEditor().state.doc;
    },
    2000,
    {
      trailing: true,
      leading: true,
      maxWait: 3000,
    },
  );

  componentDidUpdate() {
    this.context.getEditor() && this.onSave();
  }

  render() {
    return (
      <header className="z-10 flex flex-row-reverse justify-center items-center">
        {this.context.getEditor() && (
          <MenuBar getEditor={this.context.getEditor} />
        )}
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
