import React from 'react';
import { render } from '@testing-library/react';
import { TextSelection, NodeSelection } from 'prosemirror-state';
import {
  EditorContextProvider,
  EditorContext,
} from '../../src/utils/bangle-utils/helper-react/editor-context';
import { ReactEditor } from '../../src/utils/bangle-utils/helper-react/react-editor';
import {
  GapCursorSelection,
  GapCursorSide,
} from '../../src/utils/bangle-utils/gap-cursor';

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
            if (context.getEditor() && !_editor) {
              _editor = context.getEditor();
            }
            return !context.getEditor() ? null : <span data-testid={testId} />;
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
      const refs = defaultDoc.refs;

      if (refs) {
        const { doc, tr } = editorView.state;
        // Collapsed selection.
        if (positionExists(refs['<>'])) {
          setTextSelection(editorView, refs['<>']);
          // Expanded selection
        } else if (positionExists(refs['<']) || positionExists(refs['>'])) {
          if (!positionExists(refs['<'])) {
            throw new Error('A `<` ref must complement a `>` ref.');
          }
          if (!positionExists(refs['>'])) {
            throw new Error('A `>` ref must complement a `<` ref.');
          }
          setTextSelection(editorView, refs['<'], refs['>']);
        }
        // CellSelection
        else if (
          positionExists(refs['<cell']) &&
          positionExists(refs['cell>'])
        ) {
          // const anchorCell = findCellClosestToPos(doc.resolve(refs['<cell']));
          // const headCell = findCellClosestToPos(doc.resolve(refs['cell>']));
          // if (anchorCell && headCell) {
          //   dispatch(
          //     tr.setSelection(
          //       new CellSelection(
          //         doc.resolve(anchorCell.pos),
          //         doc.resolve(headCell.pos),
          //       ) ,
          //     ),
          //   );
          // }
        }
        // NodeSelection
        else if (positionExists(refs['<node>'])) {
          dispatch(tr.setSelection(NodeSelection.create(doc, refs['<node>'])));
        }
        // GapCursor right
        // This may look the wrong way around here, but looks correct in the tests. Eg:
        // doc(hr(), '{<|gap>}') = Horizontal rule with a gap cursor on its right
        // The | denotes the gap cursor's side, based on the node on the side of the |.
        else if (positionExists(refs['<|gap>'])) {
          dispatch(
            tr.setSelection(
              new GapCursorSelection(
                doc.resolve(refs['<|gap>']),
                GapCursorSide.RIGHT,
              ),
            ),
          );
        }
        // GapCursor left
        else if (positionExists(refs['<gap|>'])) {
          dispatch(
            tr.setSelection(
              new GapCursorSelection(
                doc.resolve(refs['<gap|>']),
                GapCursorSide.LEFT,
              ),
            ),
          );
        }
      }

      return refs;
    }

    return {
      ...result,
      editor: _editor,
      editorState: _editor.state,
      schema: _editor.schema,
      editorView: _editor.view,
      sel: refs ? refs['<>'] : 0,
      refs,
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
