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

const mountedView = new Set();
const rootElement = document.body;
if (typeof afterEach === 'function') {
  afterEach(() => {
    [...mountedView].forEach((view) => {
      view.destroy();
      mountedView.delete(view);
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

  // Add the base specs for lazy asses like me
  // specSheet = injectBaseSpec(specSheet);

  return (testDoc) => {
    let view;

    const editorProps = {
      attributes: { class: 'bangle-editor content' },
    };

    const editor = new BangleEditor(container, {
      specSheet,
      plugins,
      editorProps,
      ...opts,
    });

    view = editor.view;
    mountedView.add(view);

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
      // ...editor,
      editor: editor,
      view: view,
      editorState: view.state,
      schema: view.state.schema,
      // TODO deprecetate editorView
      editorView: view,
      selection: view.state.selection,
      posLabels,
      updateDoc,
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
