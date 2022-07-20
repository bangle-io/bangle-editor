/**
 * @jest-environment jsdom
 */

import {
  BangleEditor,
  BangleEditorState,
  SpecRegistry,
} from '@bangle.dev/core';
import {
  EditorState,
  EditorView,
  Node,
  Schema,
  Selection,
  TextSelection,
} from '@bangle.dev/pm';

import { getDocLabels } from './schema-builders';

const mountedEditors = new Set<BangleEditor>();
if (typeof afterEach === 'function') {
  afterEach(() => {
    [...mountedEditors].forEach((editor: BangleEditor) => {
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
  { specRegistry, plugins }: { specRegistry: SpecRegistry; plugins: any },
  testId = 'test-editor',
) {
  if (!specRegistry) {
    throw new Error('Please provide SpecRegistry');
  }

  if (!plugins) {
    throw new Error('Please provide Plugins');
  }

  let newPlugins = plugins;
  // To bypass the deprecation of plugin being a function
  plugins = () => newPlugins;
  const container = document.body.appendChild(document.createElement('div'));
  container.setAttribute('data-testid', testId);

  return (testDoc: any) => {
    let view: EditorView;

    const editorProps = {
      attributes: { class: 'bangle-editor content' },
    };
    let editor: BangleEditor = new BangleEditor(container, {
      state: new BangleEditorState({ specRegistry, plugins, editorProps }),
    });

    view = editor.view;
    mountedEditors.add(editor);

    let posLabels;

    if (testDoc) {
      posLabels = updateDoc(testDoc);
    }

    function updateDoc(doc: (schema: Schema) => Node) {
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

      const positionExists = (position: any): position is number =>
        typeof position === 'number';
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
        return editor?.view;
      },
      container,
      editorState: view.state as EditorState,
      schema: view.state.schema,
      // TODO deprecate editorView
      editorView: view,
      selection: view.state.selection as Selection,
      posLabels,
      updateDoc,
      destroy: () => {
        editor?.destroy();
        (editor as any) = null;
      },
      debugString: () => {
        return editor?.view.state.doc.toString();
      },
    };
  };
}

function setTextSelection(
  view: EditorView,
  anchor: number,
  head?: number,
): void {
  const { state } = view;
  const tr = state.tr.setSelection(
    TextSelection.create(state.doc, anchor, head),
  );
  view.dispatch(tr);
}
