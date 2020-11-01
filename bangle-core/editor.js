import { loadNodeViews, loadPlugins, schemaLoader } from './element-loaders';
import { EditorView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';

export function prosemirrorSetup(
  element,
  {
    editorSpec,
    plugins = [],
    renderNodeView,
    destroyNodeView,
    stateOpts = {},
    viewOpts = {},
  },
) {
  const { doc, content, ...otherStateOpts } = stateOpts;
  const schema = schemaLoader(editorSpec);
  const state = EditorState.create({
    schema,
    doc: doc ? doc : createDocument({ schema, content: content }),
    ...otherStateOpts,
    plugins: loadPlugins(schema, plugins),
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

  return view;
}

// TODO is this needed? copied from the ../editor.js
export function focusView(view, position = null) {
  // setTimeout(() => view?.focus(), 0); // TODO is this timeout needed
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
