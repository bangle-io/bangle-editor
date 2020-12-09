import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { pluginLoader } from './utils/plugin-loader';
import { isTestEnv } from './utils/environment';
import { DOMSerializer, DOMParser } from 'prosemirror-model';
import { SpecRegistry } from './spec-registry';
import { Node } from 'prosemirror-model';

export class BangleEditorView {
  destroyed = false;
  constructor(
    element,
    { focusOnInit = true, specRegistry, pmState, pmViewOpts = {} },
  ) {
    if (!(specRegistry instanceof SpecRegistry)) {
      throw new Error('SpecRegistry is required');
    }
    if (!(pmState instanceof EditorState)) {
      throw new Error('prosemirror State is required');
    }
    this.specRegistry = specRegistry;
    this.view = new EditorView(element, {
      state: pmState,
      dispatchTransaction(transaction) {
        const newState = this.state.apply(transaction);
        this.updateState(newState);
      },
      attributes: { class: 'bangle-editor' },

      ...pmViewOpts,
    });

    if (focusOnInit) {
      this.focusView();
    }
  }

  focusView() {
    if (isTestEnv() || this.view.focused) {
      return;
    }
    this.view.focus();
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.view.destroy();
  }

  toHTMLString() {
    const div = document.createElement('div');
    const fragment = DOMSerializer.fromSchema(
      this.specRegistry.schema,
    ).serializeFragment(this.view.state.doc.content);

    div.appendChild(fragment);
    return div.innerHTML;
  }
}

export function editorStateSetup2(
  specRegistry,
  plugins = [],
  { initialValue, editorProps, pmStateOpts = {} } = {},
) {
  const schema = specRegistry.schema;
  return EditorState.create({
    schema,
    doc: createDocument({ schema, content: initialValue }),
    plugins: pluginLoader(specRegistry, plugins, { editorProps }),
    ...pmStateOpts,
  });
}

const createDocument = ({ schema, content, parseOptions }) => {
  const emptyDocument = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  };

  if (content == null) {
    return schema.nodeFromJSON(emptyDocument);
  }

  if (content instanceof Node) {
    return content;
  }
  if (typeof content === 'object') {
    return schema.nodeFromJSON(content);
  }

  if (typeof content === 'string') {
    const element = document.createElement('div');
    element.innerHTML = content.trim();
    return DOMParser.fromSchema(schema).parse(element, parseOptions);
  }

  return false;
};
