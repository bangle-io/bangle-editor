import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { pluginLoader } from './utils/plugin-loader';
import { isTestEnv } from './utils/environment';
import { DOMSerializer, DOMParser } from 'prosemirror-model';

export class BangleEditor {
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
    this._view.destroy();
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
