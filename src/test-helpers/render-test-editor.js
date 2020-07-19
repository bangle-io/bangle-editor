'use strict';
import React from 'react';
import { render } from '@testing-library/react';
import {
  EditorContextProvider,
  EditorContext,
} from 'utils/bangle-utils/helper-react/editor-context';
import { ReactEditor } from 'utils/bangle-utils/helper-react/react-editor';
import { TextSelection } from 'prosemirror-state';

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
        <ReactEditor options={_options} />
        <EditorContext.Consumer>
          {(context) => {
            if (context.editor && !_editor) {
              _editor = context.editor;
            }
            return !context.editor ? null : <span data-testid={testId} />;
          }}
        </EditorContext.Consumer>
      </EditorContextProvider>,
    );

    await result.findByTestId('test-editor');

    const refs = updateDoc(testDoc);

    function updateDoc(doc) {
      if (!doc) {
        return;
      }
      const editorView = _editor.view;
      const defaultDoc = doc(editorView.state.schema);
      const tr = editorView.state.tr.replaceWith(
        0,
        editorView.state.doc.nodeSize - 2,
        defaultDoc.content,
      );
      tr.setMeta('addToHistory', false);
      editorView.dispatch(tr);

      const positionExists = (position) => typeof position === 'number';
      const refs = defaultDoc.refs;

      // refs
      if (positionExists(refs['<>'])) {
        const tr = setTextSelection(
          editorView,
          refs['<>'],
        )(editorView.state.tr);
        editorView.dispatch(tr);
      }

      return refs;
      // TODO other kind of refs
    }

    return {
      ...result,
      editor: _editor,
      editorState: _editor.state,
      schema: _editor.schema,
      editorView: _editor.view,
      sel: refs ? refs['<>'] : 0,
      updateDoc,
    };
  };
}

function setTextSelection(view, anchor, head) {
  const { state } = view;
  return (tr) => tr.setSelection(TextSelection.create(state.doc, anchor, head));
}
