import { domEventListener } from 'bangle-core/utils/js-utils';
import { viewHasFocus } from 'bangle-plugins/helpers/index';
import { selectionTooltipKey } from './selection-tooltip';

export class SelectionTooltipManager {
  constructor(view, options) {
    this._view = view;
    this._mouseDownState = new MouseDownState(view.dom, () => {
      this.update(view);
    });
    this._blurHandler = domEventListener(
      view.dom,
      'blur',
      () => {
        this._hide();
      },
      {
        passive: true,
      },
    );
  }

  update(view, lastState) {
    let state = view.state;
    if (
      lastState &&
      lastState.doc.eq(state.doc) &&
      lastState.selection.eq(state.selection)
    ) {
      return;
    }
    if (!viewHasFocus(view)) {
      this._hide();
      return;
    }

    if (state.selection.empty) {
      this._hide();
      return;
    }

    if (this._mouseDownState.isDown) {
      this._hide();
    } else {
      this._show();
    }
  }

  destroy() {
    this._mouseDownState.destroy();
    this._blurHandler();
  }

  _dispatchState(state) {
    this._view.dispatch(
      this._view.state.tr
        .setMeta(selectionTooltipKey, state)
        .setMeta('addToHistory', false),
    );
  }

  _show() {
    const { show } = selectionTooltipKey.getState(this._view.state);
    if (!show) {
      this._dispatchState({
        show: true,
      });
    }
  }

  _hide() {
    const { show } = selectionTooltipKey.getState(this._view.state);
    if (show) {
      this._dispatchState({
        show: false,
      });
    }
  }
}

class MouseDownState {
  constructor(element, onChange) {
    this._mouseDownListener = domEventListener(
      element,
      'mousedown',
      () => {
        const prev = this.isDown;
        this.isDown = true;
        if (onChange && prev !== this.isDown) {
          onChange(this.isDown);
        }
      },
      {
        passive: true,
      },
    );
    this._mouseUpListener = domEventListener(
      document,
      'mouseup',
      () => {
        const prev = this.isDown;
        this.isDown = false;
        if (onChange && prev !== this.isDown) {
          onChange(this.isDown);
        }
      },
      {
        passive: true,
      },
    );
  }

  destroy() {
    this._mouseDownListener();
    this._mouseDownListener = null;
    this._mouseUpListener();
    this._mouseUpListener = null;
  }
}
