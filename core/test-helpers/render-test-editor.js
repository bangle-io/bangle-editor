/**
 * @jest-environment jsdom
 */

import { TextSelection } from 'prosemirror-state';
import { getDocLabels } from './schema-builders';
import { SpecRegistry } from '../spec-registry';
import { BangleEditor } from '../bangle-editor';
import { defaultPlugins, defaultSpecs } from './default-components';
import { BangleEditorState } from '../index';

const mountedEditors = new Set();
const rootElement = document.body;
if (typeof afterEach === 'function') {
  afterEach(() => {
    [...mountedEditors].forEach((editor) => {
      editor.destroy();
      mountedEditors.delete(editor);
    });
  });
}

/**
 *
 * @param {*} param0
 * @param {SpecRegistry | undefined | Object} param0.specRegistry pass an object to set properties to all default
 *                        specs, for example calling `renderTestEditor({ specRegistry: {heading: {level : 4}}}))`
 *                        will use all the defaultSpecs with heading spec getting the options `{level:4}`.
 * @param {Array<PluginFactory> | undefined | Object} param0.specRegistry passing an object behaves similar to specRegistry param.
 * @param {*} testId
 */
export function renderTestEditor(
  { specRegistry, plugins } = {},
  testId = 'test-editor',
) {
  if (!(specRegistry instanceof SpecRegistry)) {
    specRegistry = new SpecRegistry(defaultSpecs(specRegistry));
  }

  if (!plugins || !Array.isArray(plugins)) {
    plugins = defaultPlugins(plugins);
  }

  let newPlugins = plugins;
  // To bypass the deprecation of plugin being a function
  plugins = () => newPlugins;
  const container = rootElement.appendChild(document.createElement('div'));
  container.setAttribute('data-testid', testId);

  return (testDoc) => {
    let view;

    const editorProps = {
      attributes: { class: 'bangle-editor content' },
    };
    let editor = new BangleEditor(container, {
      state: new BangleEditorState({ specRegistry, plugins, editorProps }),
    });

    view = editor.view;
    mountedEditors.add(editor);

    let posLabels;

    if (testDoc) {
      posLabels = updateDoc(testDoc);
    }

    function updateDoc(doc) {
      if (!doc) {
        return;
      }
      const editorView = view;
      const dispatch = editorView.dispatch;
      const defaultDoc = doc(editorView.state.schema);
      const tr = editorView.state.tr.replaceWith(
        0,
        editorView.state.doc.nodeSize - 2,
        defaultDoc.content,
      );
      tr.setMeta('addToHistory', false);
      dispatch(tr);

      const positionExists = (position) => typeof position === 'number';
      const posLabels = getDocLabels(defaultDoc);
      if (posLabels) {
        if (positionExists(posLabels['[]'])) {
          setTextSelection(editorView, posLabels['[]']);
        } else if (
          positionExists(posLabels['[']) ||
          positionExists(posLabels[']'])
        ) {
          if (
            !positionExists(posLabels['[']) ||
            !positionExists(posLabels[']'])
          ) {
            throw new Error('`[``]` must come in pair.');
          }

          setTextSelection(editorView, posLabels['['], posLabels[']']);
        }
      }

      return posLabels;
    }

    return {
      get editor() {
        return editor;
      },
      get view() {
        return editor.view;
      },
      container,
      editorState: view.state,
      schema: view.state.schema,
      // TODO deprecate editorView
      editorView: view,
      selection: view.state.selection,
      posLabels,
      updateDoc,
      destroy: () => {
        editor.destroy();
        editor = null;
      },
    };
  };
}

function setTextSelection(view, anchor, head) {
  const { state } = view;
  const tr = state.tr.setSelection(
    TextSelection.create(state.doc, anchor, head),
  );
  view.dispatch(tr);
}
