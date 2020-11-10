/**
 * @jest-environment jsdom
 */

import { TextSelection } from 'prosemirror-state';
import { getDocLabels } from './schema-builders';
import { corePlugins } from '../components/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { BangleEditor } from 'bangle-core/editor';

const defaultSpecSheet = new SpecSheet();
const defaultPlugins = corePlugins();

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

export function renderTestEditor(
  { specSheet = defaultSpecSheet, plugins = defaultPlugins, ...opts } = {},
  testId = 'test-editor',
) {
  if (!(specSheet instanceof SpecSheet)) {
    throw new Error('Need to be specsheet');
  }
  const container = rootElement.appendChild(document.createElement('div'));
  container.setAttribute('data-testid', testId);

  return (testDoc) => {
    let view;

    const editorProps = {
      attributes: { class: 'bangle-editor content' },
    };

    let editor = new BangleEditor(container, {
      specSheet,
      plugins,
      editorProps,
      ...opts,
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
      // TODO deprecetate editorView
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
