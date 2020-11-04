import React from 'react';
import { MenuBar } from './menu';
import { EditorContext } from 'bangle-react/editor-context';

export class Header extends React.PureComponent {
  static contextType = EditorContext;
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
