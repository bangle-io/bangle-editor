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
import { compose } from 'lodash/fp';
import { buildInputRules } from 'prosemirror-setup/src/input-rules';
import { buildMenuItems } from 'prosemirror-setup/src/menu';
import { buildKeymap } from 'prosemirror-setup/src/keymap';
import { schema as baseSchema } from 'prosemirror-setup/src/schema';
import { menuBar } from 'prosemirror-menu';
import 'prosemirror-setup/style/style.css';
import { schemaCompose } from 'bangle-utils';
import * as dinos from 'dinos';
import * as emoji from 'emoji';

const schema = schemaCompose(dinos.insertSchema, emoji.insertSchema)(
  baseSchema
);
const builtMenu = buildMenuItems(
  schema,
  compose(
    dinos.insertMenuItem(schema),
    emoji.insertMenuItem(schema)
  )
);

const nodeViews = {
  ...dinos.getNodeView(),
  ...emoji.getNodeView()
};

export class ProseMirrorView {
  constructor(target, content) {
    var template = document.createElement('template');
    template.innerHTML = `<div id=content style="display: none">
      <h5>Too-minor header</h5>
    </div>
    `.trim();

    this.view = new EditorView(target, {
      nodeViews,
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
            content: builtMenu.fullMenu,
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
        window.tr = tr;
        const editorState = this.view.state.apply(tr);
        if (editorState) {
          console.groupCollapsed('state');
          console.log(JSON.stringify(editorState.doc, null, 2));
          console.groupEnd('state');
        }
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
