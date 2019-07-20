import React from 'react';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { Plugin } from 'prosemirror-state';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { DOMParser } from 'prosemirror-model';
import {
  buildInputRules,
  buildMenuItems,
  buildKeymap,
  schema
} from 'prosemirror-setup';
import { menuBar } from 'prosemirror-menu';

export class ProseMirrorView {
  constructor(target, content) {
    var template = document.createElement('template');
    template.innerHTML = `<div id=content style="display: none">
      <h5>Too-minor header</h5>
    </div>
    `.trim();

    this.view = new EditorView(target, {
      state: EditorState.create({
        // doc: defaultMarkdownParser.parse(content),
        doc: DOMParser.fromSchema(schema).parse(template.content.firstChild),
        plugins: [
          buildInputRules(schema),
          keymap(buildKeymap(schema)),
          keymap(baseKeymap),
          dropCursor(),
          gapCursor(),
          menuBar({
            content: buildMenuItems(schema).fullMenu,
            props: {
              class: 'kushan-rocks'
            }
          }),
          history(),
          new Plugin({
            props: {
              attributes: { class: 'bangle-editor' }
            }
          })
        ]
      }),
      dispatchTransaction: tr => {
        // intercept the transaction cycle
        console.info(tr);
        const editorState = this.view.state.apply(tr);
        this.view.updateState(editorState);
      }
    });
  }
  focus() {
    this.view.focus();
  }
  destroy() {
    this.view.destroy();
  }
}

export class ProsemirrorComp extends React.Component {
  myRef = React.createRef();
  componentDidMount() {
    const node = this.myRef.current;
    if (node) {
      const view = new ProseMirrorView(node, `Hello world!`);
      view.focus();
    }
  }

  render() {
    return <div ref={this.myRef} className="ProsemirrorComp" />;
  }
}
