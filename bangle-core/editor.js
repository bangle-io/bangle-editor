import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { focusAtPosition } from './components/doc';
import { pluginsLoader } from './utils/plugins-loader';
import { nodeViewsLoader } from './utils/node-views-loader';

export class BangleEditor {
  constructor(
    element,
    {
      specSheet,
      plugins = [],
      renderNodeView,
      destroyNodeView,
      stateOpts = {},
      viewOpts = {},
      editorProps,
      focusOnInit = true,
    },
  ) {
    const state = editorStateSetup({
      plugins,
      editorProps,
      specSheet,
      stateOpts,
    });

    this._view = new EditorView(element, {
      state,
      dispatchTransaction(transaction) {
        const newState = this.state.apply(transaction);
        this.updateState(newState);
      },
      nodeViews: nodeViewsLoader(specSheet, renderNodeView, destroyNodeView),
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
    if (process.env.NODE_ENV === 'test' || view.focused) {
      return;
    }

    return focusAtPosition()(view.state, view.dispatch, view);
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
