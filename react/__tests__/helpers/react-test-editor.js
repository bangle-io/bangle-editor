/**
 * @jest-environment jsdom
 */
import { act } from '@testing-library/react';
import React from 'react';
import { TextSelection } from '@banglejs/core/prosemirror/state';
import { render } from '@testing-library/react';
import { getDocLabels } from '@banglejs/core/test-helpers/index';
import { ReactEditorView, useEditorState } from '../../index';

function ReactEditor({
  id,
  onEditorReady,
  renderNodeViews,
  specRegistry,
  plugins,
  editorProps,
}) {
  const editorState = useEditorState({ specRegistry, plugins, editorProps });

  return (
    <ReactEditorView
      id={id}
      editorState={editorState}
      onReady={onEditorReady}
      renderNodeViews={renderNodeViews}
    />
  );
}

export function reactTestEditor({
  specRegistry,
  plugins: _plugins,
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

    // To functions, so that when using hooks plugins dont keep getting
    //  instantiation
    // TODO: move all the caller of reactTestEditor to use function for of `_plugins`
    // const plugins = typeof _plugins !== 'function' ? () => _plugins : _plugins;

    let result;
    act(() => {
      result = render(
        <ReactEditor
          id={id}
          onEditorReady={_onReady}
          renderNodeViews={renderNodeViews}
          specRegistry={specRegistry}
          plugins={_plugins}
          editorProps={editorProps}
        />,
      );
    });

    let element = await result.container.querySelector('#test-editor');
    if (!element) {
      throw new Error('Unable to mount bangle editor');
    }
    let view = editor.view;

    let posLabels;

    if (testDoc) {
      act(() => {
        posLabels = updateDoc(testDoc);
      });
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
      // TODO deprecate editorView
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
