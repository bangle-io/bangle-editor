import '@bangle.dev/core/style.css';
import '@bangle.dev/tooltip/style.css';
import {
  BangleEditor,
  BangleEditorState,
  PluginKey,
  Plugin,
} from '@bangle.dev/core';
import { corePlugins, coreSpec } from '@bangle.dev/core/utils/core-components';
import { setSelectionAtEnd } from '@bangle.dev/core/core-commands';
import { selectionTooltip } from '@bangle.dev/tooltip';

const placeholderKey = new PluginKey('placeholder');

function placeholder() {
  return [
    selectionTooltip.plugins({
      key: placeholderKey,
      tooltipRenderOpts: {
        placement: 'right',
      },
      calculateType: (state, prevType) => {
        const parent = state.selection.$from.parent;
        // Show placeholder when selection is empty and the parent node is empty.
        return state.selection.empty && parent && parent.content.size === 0
          ? 'placeholder'
          : // setting null will make the `selectionTooltip` hide
            null;
      },
    }),

    new Plugin({
      view: () => ({
        update: (view, prevState) => {
          const { state } = view;
          const { tooltipContentDOM, type } = placeholderKey.getState(state);
          if (type === 'placeholder') {
            const text = state.doc.textBetween(0, state.doc.content.size, ' ');
            const wordCount = text.split(/\s+/).filter(Boolean).length;
            tooltipContentDOM.innerHTML = `<span style="user-select:none;">Word count: ${wordCount}</span>`;
          }
        },
      }),
    }),
  ];
}

export default function Editor(domNode) {
  const state = new BangleEditorState({
    specs: [coreSpec()],
    plugins: () => [corePlugins(), placeholder()],
    initialValue: `<p>Let us show the word count on every new line!</p>
    <p></p>`,
  });

  const editor = new BangleEditor(domNode, { state });
  const { view } = editor;
  // set selection at end to demo the example
  setSelectionAtEnd(view.state.doc)(view.state, view.dispatch);
  return editor;
}
