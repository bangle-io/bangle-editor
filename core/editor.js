import { Node, DOMSerializer, DOMParser } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';

import { pluginLoader } from './utils/plugin-loader';
import { isTestEnv } from './utils/environment';
import { SpecRegistry } from './spec-registry';

export class BangleEditorView {
  destroyed = false;
  constructor(element, { focusOnInit = true, state, pmViewOpts = {} }) {
    if (!(state instanceof BangleEditorState)) {
      throw new Error(
        'state is required and must be an instance of BangleEditorState',
      );
    }

    this.specRegistry = state.specRegistry;
    this.view = new EditorView(element, {
      state: state.pmState,
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

export class BangleEditorState {
  constructor({
    specRegistry,
    specs,
    plugins = [],
    initialValue,
    editorProps,
    defaultSpecs = true,
    pmStateOpts,
  } = {}) {
    if (specs && specRegistry) {
      throw new Error('Cannot have both specs and specRegistry defined');
    }
    if (!specRegistry) {
      specRegistry = new SpecRegistry(specs, { defaultSpecs });
    }

    this.specRegistry = specRegistry;
    const schema = this.specRegistry.schema;

    this.pmState = EditorState.create({
      schema,
      doc: createDocument({ schema, content: initialValue }),
      plugins: pluginLoader(specRegistry, plugins, { editorProps }),
      ...pmStateOpts,
    });
  }
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
