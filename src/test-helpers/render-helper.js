import React from 'react';
import { render } from '@testing-library/react';
import { TextSelection } from 'prosemirror-state';
import {
  EditorContextProvider,
  EditorContext,
} from '../../src/utils/bangle-utils/helper-react/editor-context';
import { ReactEditor } from '../../src/utils/bangle-utils/helper-react/react-editor';

import { getDocLabels } from './schema-builders';

export function renderTestEditor(options = {}, testId = 'test-editor') {
  return async (testDoc) => {
    const _options = {
      id: 'test-editor',
      editorProps: {
        attributes: { class: 'bangle-editor content' },
      },
      extensions: [...(options.extensions || [])],
      ...options,
    };

    let _editor;

    const result = render(
      <EditorContextProvider>
        <ReactEditor options={_options} content={_options.content || ''} />
        <EditorContext.Consumer>
          {(context) => {
            if (context.getEditor() && !_editor) {
              _editor = context.getEditor();
            }
            return !context.getEditor() ? null : <span data-testid={testId} />;
          }}
        </EditorContext.Consumer>
      </EditorContextProvider>,
    );

    await result.findByTestId(testId);

    let posLabels;

    if (testDoc) {
      posLabels = updateDoc(testDoc);
    }

    function updateDoc(doc) {
      if (!doc) {
        return;
      }
      const editorView = _editor.view;
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
      ...result,
      editor: _editor,
      editorState: _editor.view.state,
      schema: _editor.view.state.schema,
      editorView: _editor.view,
      selection: _editor.view.state.selection,
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
