import React from 'react';
import { render } from '@testing-library/react';
import { TextSelection } from 'prosemirror-state';
import { ReactEditor } from 'bangle-core/helper-react/react-editor';
import { getDocLabels } from './schema-builders';
import { doc, text, paragraph } from 'bangle-core/nodes/index';
import { corePlugins, coreSpec } from 'bangle-core/components';

const defaultEditorSpec = coreSpec();
const defaultPlugins = corePlugins();

export function renderTestEditor2(
  { editorSpec = defaultEditorSpec, plugins = defaultPlugins } = {},
  testId = 'test-editor',
) {
  // Add the base specs for lazy asses like me
  editorSpec = injectBaseSpec(editorSpec);

  return async (testDoc) => {
    let view;
    const onReady = (_view) => {
      view = _view;
    };

    const _options = {
      id: 'test-editor',
      testId: testId,
      editorProps: {
        attributes: { class: 'bangle-editor content' },
      },
      onReady,
      ...{ editorSpec, plugins },
    };

    const result = render(<ReactEditor options={_options} />);

    await result.findByTestId(testId);

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
      ...result,
      get editor() {
        throw new Error('wtf');
      },
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

// TODO  Is this really needed, why are we expecting lazy developers?
function injectBaseSpec(editorSpec) {
  editorSpec = [...editorSpec];
  const uniqueNames = new Set(editorSpec.map((r) => r.name));
  if (!uniqueNames.has('paragraph')) {
    editorSpec.unshift(paragraph.spec());
  }

  if (!uniqueNames.has('text')) {
    editorSpec.unshift(text.spec());
  }

  if (!uniqueNames.has('doc')) {
    editorSpec.unshift(doc.spec());
  }

  return editorSpec;
}
