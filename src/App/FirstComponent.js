import './style.css';
import './menu.css';

import React from 'react';
import applyDevTools from 'prosemirror-dev-tools';

import Dinos from 'Plugins/dinos';

import { Editor } from 'Utils/bangle-utils/helper-classes/editor';
import { Bold } from 'Utils/bangle-utils/helper-marks/bold';
import { Code } from 'Utils/bangle-utils/helper-marks/code';
import { Italic } from 'Utils/bangle-utils/helper-marks/italic';
import { Link } from 'Utils/bangle-utils/helper-marks/link';
import { Strike } from 'Utils/bangle-utils/helper-marks/strike';
import { Underline } from 'Utils/bangle-utils/helper-marks/underline';
import { MenuExtension } from './components/menu/index';

export class ProsemirrorComp extends React.Component {
  myRef = React.createRef();
  state = {};
  componentDidMount() {
    const node = this.myRef.current;
    if (node) {
      let editor = new Editor(node, {
        extensions: [
          new Bold(),
          new Code(),
          new Italic(),
          new Link(),
          new Strike(),
          new Underline(),
          new Dinos(),
          new MenuExtension(),
        ],
      });
      this.setState({
        editor,
      });
      applyDevTools(editor.view);
      editor.view.focus();
    }
  }

  render() {
    return (
      <>
        <div ref={this.myRef} className="ProsemirrorComp" />
        {this.state.editor
          ? this.state.editor.reactComponents.map(([name, ReactElement]) => {
              return <ReactElement key={name} />;
            })
          : null}
      </>
    );
  }
}
