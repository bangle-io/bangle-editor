import './style.css';
import './menu.css';

import React from 'react';
import { createPortal } from 'react-dom';

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
} from 'Utils/bangle-utils/nodes';

import { menuExtension } from './components/menu/index';
import { WrapperFoo, GrouperComp } from './Wrapper';
import { PortalProvider, PortalRenderer } from './portal';

export class ProsemirrorComp extends React.Component {
  myRef = React.createRef();
  state = {};
  domElementMap = new Map();
  nodeTypeMap = new Map();
  counter = 0;
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
          new Blockquote(),
          new BulletList(),
          new CodeBlock(),
          new HardBreak(),
          new Heading(),
          new HorizontalRule(),
          new ListItem(),
          new TodoItem(),
          new TodoList(),
          new OrderedList(),
          new Dinos(),
          new Emoji(),
          menuExtension,
          new History(),
        ],
        editorProps: {
          attributes: { class: 'bangle-editor' },
        },

        renderNodeView: this.renderNodeView,
        destroyNodeView: this.destroyNodeView,
        content: `
        <h2>
          Hi there,
        </h2>
        <p>
          this is a very <em>basic</em> example of bangle. 
          <span data-type="emoji" data-emojikind=":handball_tone4:‍♀️"></span>
          <span data-type="emoji" data-emojikind=":bug:"></span>
        </p>
        <ul data-type="todo_list">
          <li data-type="todo_item" data-done="false">
            <span class="todo-checkbox" contenteditable="false"></span>
            <div class="todo-content">
              <p>This is a checkbox
              <span data-type="emoji" data-emojikind=":mrs_claus_tone2:"></span>
              </p>
            </div>
          </li>
        </ul>
        <pre><code>body { display: none; }</code></pre>
        <ul>
          <li>
            A regular list
          </li>
          <li>
            With regular items
          </li>
        </ul>
        <blockquote>
          It's amazing 👏
          <br />
          – mom
        </blockquote>
      `,
      });
      this.setState({
        editor,
      });
      applyDevTools(editor.view);
      editor.focus();
      window.editor = editor;
    }
  }

  renderNodeView = (args) => {
    // comes from custom-node-view.js#renderComp
    const { node, view, handleRef, updateAttrs, dom, extension } = args;

    this.props.portalProviderAPI.render(
      () => (
        <extension.render
          {...{
            node,
            view,
            handleRef,
            updateAttrs,
          }}
        />
      ),
      dom,
      false,
    );

    // const [_, insiders] = this.nodeTypeMap.get(extension.name) || [
    //   this.counter++,
    //   new Map(),
    // ];

    // // if (!insiders) {
    // //   insiders = new Map();
    // // }
    // this.nodeTypeMap.set(extension.name, [this.counter++, insiders]);
    // // console.log(insiders);
    // insiders.set(dom, [
    //   extension.render,
    // {
    //   node,
    //   view,
    //   handleRef,
    //   updateAttrs,
    // },
    // ]);

    // this.forceUpdate();
  };

  destroyNodeView = (dom) => {
    this.props.portalProviderAPI.remove(dom);
  };

  render() {
    return (
      <>
        <div ref={this.myRef} className="ProsemirrorComp" />
        <PortalRenderer portalProviderAPI={this.props.portalProviderAPI} />
      </>
    );
  }
}
