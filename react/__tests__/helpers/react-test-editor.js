/**
 * @jest-environment jsdom
 */
import React from 'react';
import { TextSelection } from '@banglejs/core/prosemirror/state';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { render } from '@testing-library/react';
import { getDocLabels } from '@banglejs/core/test-helpers/index';
import { ReactEditor } from '../../ReactEditor';

export function reactTestEditor({
  specRegistry,
  plugins,
  renderNodeViews,
  id = 'test-editor',
} = {}) {
  return async (testDoc) => {
    let editor;
    const _onReady = (_editor) => {
      editor = _editor;
    };

    const editorProps = {
      attributes: { class: 'bangle-editor content' },
    };

    const _options = {
      id,
      editorProps,
      ...{ specRegistry, plugins },
    };

    const result = render(
      <ReactEditor
        options={_options}
        onReady={_onReady}
        renderNodeViews={renderNodeViews}
      />,
    );

    let element = await result.container.querySelector('#test-editor');
    if (!element) {
      throw new Error('Unable to mount bangle editor');
    }
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
