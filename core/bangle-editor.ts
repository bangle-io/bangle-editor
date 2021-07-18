import { isTestEnv } from '@bangle.dev/js-utils';
import { DirectEditorProps, EditorView } from '@bangle.dev/pm';
import { toHTMLString } from '@bangle.dev/pm-utils';
import { BangleEditorState } from './bangle-editor-state';

type PMViewOpts = Omit<
  DirectEditorProps,
  'state' | 'dispatchTransaction' | 'attributes'
>;

export interface BangleEditorProps {
  focusOnInit?: boolean;
  state: BangleEditorState;
  pmViewOpts?: PMViewOpts;
}

export class BangleEditor {
  destroyed: boolean;
  view: EditorView;

  constructor(
    element: HTMLElement,
    { focusOnInit = true, state, pmViewOpts = {} }: BangleEditorProps,
  ) {
    this.destroyed = false;
    if (!(state instanceof BangleEditorState)) {
      throw new Error(
        'state is required and must be an instance of BangleEditorState',
      );
    }

    this.view = new EditorView(element, {
      state: state.pmState,
      dispatchTransaction(transaction) {
        const newState = this.state.apply(transaction);
        this.updateState(newState);
      },
      attributes: { class: 'bangle-editor' },
      ...pmViewOpts,
    });

    if (focusOnInit) {
      this.focusView();
    }
  }

  focusView() {
    if (isTestEnv || this.view.hasFocus()) {
      return;
    }
    this.view.focus();
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    // If view was destroyed directly
    // @ts-ignore EditorView.docView is missing in @types/prosemirror-view
    if (this.view.docView === null) {
      this.destroyed = true;
      return;
    }

    this.destroyed = true;
    this.view.destroy();
  }

  toHTMLString() {
    return toHTMLString(this.view.state);
  }
}
