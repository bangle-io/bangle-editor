import { loadNodeViews, loadPlugins, schemaLoader } from './element-loaders';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
import { focusAtPosition } from './nodes/doc';

export function editorStateSetup({
  plugins = [],
  editorProps,
  editorSpec,
  stateOpts = {},
}) {
  const { doc, content, ...otherStateOpts } = stateOpts;

  const schema = schemaLoader(editorSpec);

  const state = EditorState.create({
    schema,
    doc: doc ? doc : createDocument({ schema, content: content }),
    ...otherStateOpts,
    plugins: loadPlugins(editorSpec, plugins, { editorProps }),
  });

  return state;
}

export function prosemirrorSetup(
  element,
  {
    editorSpec,
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
    editorSpec,
    stateOpts,
  });

  const view = new EditorView(element, {
    state,
    dispatchTransaction(transaction) {
      const newState = this.state.apply(transaction);
      this.updateState(newState);
    },
    nodeViews: loadNodeViews(editorSpec, renderNodeView, destroyNodeView),
    ...viewOpts,
  });

  if (focusOnInit) {
    focusView(view);
  }

  return view;
}

export function focusView(view) {
  if (process.env.NODE_ENV === 'test' || view.focused) {
    return;
  }

  return focusAtPosition()(view.state, view.dispatch, view);
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
