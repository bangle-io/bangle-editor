import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { pluginLoader } from './utils/plugin-loader';
import { isTestEnv } from './utils/environment';
import { DOMSerializer, DOMParser } from 'prosemirror-model';
import { SpecRegistry } from './spec-registry';

export class BangleEditor {
  destroyed = false;
  constructor(
    element,
    {
      specRegistry,
      plugins = [],
      viewOpts = {},
      editorProps,
      stateOpts = {},
      state = editorStateSetup({
        plugins,
        editorProps,
        specRegistry,
        stateOpts,
      }),
      focusOnInit = true,
    },
  ) {
    this._specRegistry = specRegistry;

    this._view = new EditorView(element, {
      state,
      dispatchTransaction(transaction) {
        const newState = this.state.apply(transaction);
        this.updateState(newState);
      },
      ...viewOpts,
      attributes: { class: 'bangle-editor' },
    });

    if (focusOnInit) {
      this.focusView();
    }
  }

  get view() {
    return this._view;
  }

  focusView() {
    const view = this._view;
    if (isTestEnv() || view.focused) {
      return;
    }
    view.focus();
  }

  toHTMLString() {
    const div = document.createElement('div');
    const fragment = DOMSerializer.fromSchema(
      this._specRegistry.schema,
    ).serializeFragment(this._view.state.doc.content);

    div.appendChild(fragment);

    return div.innerHTML;
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this._view.destroy();
  }
}

export class BangleEditorView {
  destroyed = false;
  constructor(element, { specRegistry, pmState, pmViewOpts = {} }) {
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

export function editorStateSetup({
  plugins = [],
  editorProps,
  specRegistry,
  stateOpts = {},
}) {
  const { doc, content, ...otherStateOpts } = stateOpts;

  const schema = specRegistry.schema;

  const state = EditorState.create({
    schema,
    doc: doc ? doc : createDocument({ schema, content: content }),
    ...otherStateOpts,
    plugins: pluginLoader(specRegistry, plugins, { editorProps }),
  });

  return state;
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
