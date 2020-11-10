/**
 * @jest-environment jsdom
 */
import React from 'react';
import { TextSelection } from 'prosemirror-state';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { render } from '@testing-library/react';
import { ReactEditor } from 'bangle-react/react-editor';
import { corePlugins } from 'bangle-core/index';
import { getDocLabels } from 'bangle-core/test-helpers/index';

const defaultSpecSheet = new SpecSheet();
const defaultPlugins = corePlugins();

export function reactTestEditor(
  {
    specSheet = defaultSpecSheet,
    plugins = defaultPlugins,
    renderNodeViews,
  } = {},
  testId = 'test-editor',
) {
  if (!(specSheet instanceof SpecSheet)) {
    throw new Error('Need to be specsheet');
  }

  return async (testDoc) => {
    let editor;
    const onReady = (_editor) => {
      editor = _editor;
    };

    const editorProps = {
      attributes: { class: 'bangle-editor content' },
    };

    const _options = {
      id: 'test-editor',
      testId,
      editorProps,
      ...{ specSheet, plugins },
    };

    const result = render(
      <ReactEditor
        options={_options}
        onReady={onReady}
        renderNodeViews={renderNodeViews}
      />,
    );

    await result.findByTestId(testId);

    let view = editor.view;

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
      editor: editor,
      container: result.container,
      renderResult: result,
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
