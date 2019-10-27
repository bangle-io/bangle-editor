import 'bangle-utils/src/setup-helpers/style.css';
import 'bangle-utils/src/menu-plugin/menu.css';

import React from 'react';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { Plugin } from 'prosemirror-state';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { DOMParser } from 'prosemirror-model';
import { compose } from 'lodash/fp';
import { menuBar } from 'prosemirror-menu';
import applyDevTools from 'prosemirror-dev-tools';
import * as dinos from 'dinos';
import * as emoji from 'emoji';
import CommandPalette from 'command-palette';

// semi-internal
import { menuPlugin } from 'bangle-utils';
import { buildInputRules } from 'bangle-utils/src/setup-helpers/inputrules';
import { buildMenuItems } from 'bangle-utils/src/setup-helpers/menu';
import { buildKeymap } from 'bangle-utils/src/setup-helpers/keymap';
import { schema as baseSchema } from 'bangle-utils/src/setup-helpers/schema';

import menuItems from './components/menu/menu-items';
import getMarkAttrs from 'bangle-utils/src/prosemirror-utils';

export class ProseMirrorView {
  constructor(target, { nodeViews, schema, plugins, onStateUpdate }) {
    const builtMenu = buildMenuItems(
      schema,
      compose(
        dinos.insertMenuItem(schema),
        emoji.insertMenuItem(schema),
      ),
    );
    var template = document.createElement('template');
    template.innerHTML = `<div id=content style="display: none">
      <h5>Too-minor header</h5>
      <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
        Why do we use it?
        It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).
      </p>      
    </div>
    `.trim();

    this.view = new EditorView(target, {
      nodeViews,
      state: EditorState.create({
        // doc: defaultMarkdownParser.parse(content),
        doc: DOMParser.fromSchema(schema).parse(template.content.firstChild),
        plugins: [
          buildInputRules(schema),
          ...plugins,
          keymap(buildKeymap(schema)),
          keymap(baseKeymap),
          dropCursor(),
          gapCursor(),
          menuBar({
            content: builtMenu.fullMenu,
            props: {
              class: 'kushan-rocks',
            },
          }),
          menuPlugin.menuPlugin({ schema, menuItems: menuItems }),
          history(),
          new Plugin({
            props: {
              attributes: { class: 'bangle-editor' },
            },
          }),

          // TODO, consolidate linking
          // Handle link clicking, thnis plugin is needed
          // to allow for handling of clicking of links or else PM eats them
          new Plugin({
            props: {
              handleClick: (view, pos, event) => {
                const { schema } = view.state;
                const attrs = getMarkAttrs(view.state, schema.marks.link);
                if (attrs.href && event.target instanceof HTMLAnchorElement) {
                  event.stopPropagation();
                  window.open(attrs.href);
                }
              },
            },
          }),
        ],
      }),
      dispatchTransaction: (tr) => {
        // intercept the transaction cycle
        const prevEditorState = this.view.state;
        const newEditorState = this.view.state.apply(tr);
        this.view.updateState(newEditorState);
        onStateUpdate(tr, this.view, prevEditorState, newEditorState);
      },
    });
    window.view = this.view;
    applyDevTools(this.view);
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
  nodeViews = {};
  schema = baseSchema;
  plugins = [];
  editorStateUpdaterHandlers = [];
  componentDidMount() {
    const node = this.myRef.current;

    const plugins = this.plugins.reduce((prev, cur) => {
      let plugin = cur;

      if (typeof cur === 'function') {
        plugin = cur({
          schema: this.schema,
        });
      }

      prev.push(...(Array.isArray(plugin) ? plugin : [plugin]));
      return prev;
    }, []);

    if (node) {
      const view = new ProseMirrorView(node, {
        nodeViews: this.nodeViews,
        schema: this.schema,
        plugins: plugins,
        onStateUpdate: this.onStateUpdate,
      });
      view.focus();
    }
  }

  addNodeView = (nodeViewObject) => {
    this.nodeViews = Object.assign(this.nodeViews, nodeViewObject);
  };

  addSchema = (nodeSchema) => {
    this.schema = new Schema({
      ...this.schema.spec,
      nodes: this.schema.spec.nodes.addToEnd(
        nodeSchema.type,
        nodeSchema.schema,
      ),
    });
  };

  addPlugins = (plugins) => {
    this.plugins.push(...(Array.isArray(plugins) ? plugins : [plugins]));
  };

  onStateUpdate = (...args) => {
    this.editorStateUpdaterHandlers.forEach((handler) => handler(...args));
  };

  registerEditorStateHandlers = (handler) => {
    this.editorStateUpdaterHandlers.push(handler);
  };

  render() {
    return (
      <>
        <div ref={this.myRef} className="ProsemirrorComp" />
        <dinos.DinoComponent
          addNodeView={this.addNodeView}
          addSchema={this.addSchema}
        />
        <emoji.Emoji
          addNodeView={this.addNodeView}
          addSchema={this.addSchema}
        />
        <CommandPalette
          addPlugins={this.addPlugins}
          onEditorStateUpdate={this.registerEditorStateHandlers}
        />
      </>
    );
  }
}
