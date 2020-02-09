import 'Utils/bangle-utils/setup-helpers/style.css';
import 'Utils/bangle-utils/menu-plugin/menu.css';

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
import { compose } from 'ramda';
import { menuBar } from 'prosemirror-menu';
import applyDevTools from 'prosemirror-dev-tools';
import { toggleMark } from 'prosemirror-commands';

import {
  CommandPalette,
  commandPalettePlugins
} from 'Plugins/inline-command-palette';

// semi-internal
import * as dinos from 'Plugins/dinos';
import * as emoji from 'Plugins/emoji';
import { menuPlugin } from 'Utils/bangle-utils';
import { buildInputRules } from 'Utils/bangle-utils/setup-helpers/inputrules';
import { buildMenuItems } from 'Utils/bangle-utils/setup-helpers/menu';
import { buildKeymap } from 'Utils/bangle-utils/setup-helpers/keymap';
import { schema as baseSchema } from 'Utils/bangle-utils/setup-helpers/schema';

import menuItems from './components/menu/menu-items';
import getMarkAttrs from 'Utils/bangle-utils/prosemirror-utils';
import { typeaheadItems } from './components/menu/typeahead-items';

export class ProseMirrorView {
  constructor(target, { nodeViews, schema, plugins, onStateUpdate }) {
    const builtMenu = buildMenuItems(
      schema,
      compose(dinos.insertMenuItem(schema), emoji.insertMenuItem(schema))
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
        doc: DOMParser.fromSchema(schema).parse(template.content.firstChild),
        plugins: [
          buildInputRules(schema),
          ...plugins.reduce((prev, cur) => {
            let plugin =
              typeof cur !== 'function'
                ? cur
                : cur({
                    schema: schema
                  });

            return prev.concat(plugin);
          }, []),
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
          menuPlugin.menuPlugin({ schema, menuItems: menuItems.concat() }),
          history(),
          keymap({
            'Ctrl-q': (state, dispatch) => {
              let { doc, selection } = state;
              if (selection.empty) return false;
              let attrs = null;
              if (
                !doc.rangeHasMark(
                  selection.from,
                  selection.to,
                  schema.marks.link
                )
              ) {
                attrs = { href: prompt('Link to where?', '') };
                if (!attrs.href) return false;
              }
              return toggleMark(schema.marks.link, attrs)(state, dispatch);
            }
          }),
          new Plugin({
            props: {
              attributes: { class: 'bangle-editor' }
            }
          }),
          // TODO, consolidate linking
          // Handle link clicking, thnis plugin is needed
          // to allow for handling of clicking of links or else PM eats them
          new Plugin({
            props: {
              handleClick: (view, pos, event) => {
                const { schema } = view.state;
                // TODO: clicking doesnt work if you click on the edges or a single character
                const attrs = getMarkAttrs(view.state, schema.marks.link);
                if (attrs.href && event.target instanceof HTMLAnchorElement) {
                  event.stopPropagation();
                  window.open(attrs.href);
                }
              }
            }
          })
        ]
      }),
      dispatchTransaction: tr => {
        // intercept the transaction cycle
        // console.log(tr);
        const prevEditorState = this.view.state;
        const editorState = this.view.state.apply(tr);
        this.view.updateState(editorState);
        onStateUpdate({
          tr,
          view: this.view,
          prevEditorState,
          editorState
        });
      }
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
  plugins = [...commandPalettePlugins];
  editorStateUpdaterHandlers = [];
  componentDidMount() {
    const node = this.myRef.current;

    if (node) {
      const view = new ProseMirrorView(node, {
        nodeViews: this.nodeViews,
        schema: this.schema,
        plugins: this.plugins,
        onStateUpdate: this.onStateUpdate
      });
      view.focus();
    }
  }

  addNodeView = nodeViewObject => {
    this.nodeViews = Object.assign(this.nodeViews, nodeViewObject);
  };

  addSchema = nodeSchema => {
    this.schema = new Schema({
      ...this.schema.spec,
      nodes: this.schema.spec.nodes.addToEnd(nodeSchema.type, nodeSchema.schema)
    });
  };

  addPlugins = plugins => {
    this.plugins = this.plugins.concat(plugins);
  };

  onStateUpdate = (...args) => {
    this.editorStateUpdaterHandlers.forEach(handler => handler(...args));
  };

  registerEditorStateHandlers = handler => {
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
          items={typeaheadItems}
        />
      </>
    );
  }
}
