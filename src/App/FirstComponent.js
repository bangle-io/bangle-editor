import './style.css';
import './menu.css';

import React from 'react';
import applyDevTools from 'prosemirror-dev-tools';

import Dinos from 'Plugins/dinos';
import Emoji from 'Plugins/emoji';

import { Editor } from 'Utils/bangle-utils';
import { History } from 'Utils/bangle-utils/extensions';
import {
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
} from 'Utils/bangle-utils/marks';

import { menuExtension } from './components/menu/index';

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
          new Emoji(),
          menuExtension,
          new History(),
        ],
        editorProps: {
          attributes: { class: 'bangle-editor' },
        },
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
