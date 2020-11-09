import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { focusAtPosition } from './components/doc';
import { pluginsLoader } from './utils/plugins-loader';
import { isTestEnv } from './utils/process-env';
import { DOMSerializer, DOMParser } from 'prosemirror-model';

export class BangleEditor {
  constructor(
    element,
    {
      specSheet,
      plugins = [],
      viewOpts = {},
      editorProps,
      stateOpts = {},
      state = editorStateSetup({
        plugins,
        editorProps,
        specSheet,
        stateOpts,
      }),
      focusOnInit = true,
    },
  ) {
    this._specSheet = specSheet;

    this._view = new EditorView(element, {
      state,
      dispatchTransaction(transaction) {
        const newState = this.state.apply(transaction);
        this.updateState(newState);
      },
      ...viewOpts,
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

    return focusAtPosition()(view.state, view.dispatch, view);
  }

  toHTMLString() {
    const div = document.createElement('div');
    const fragment = DOMSerializer.fromSchema(
      this._specSheet.schema,
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
  specSheet,
  stateOpts = {},
}) {
  const { doc, content, ...otherStateOpts } = stateOpts;

  const schema = specSheet.schema;

  const state = EditorState.create({
    schema,
    doc: doc ? doc : createDocument({ schema, content: content }),
    ...otherStateOpts,
    plugins: pluginsLoader(specSheet, plugins, { editorProps }),
  });

  return state;
}

const createDocument = ({ schema, content, parseOptions }) => {
  // TODO : this assumes a lot about schema
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
