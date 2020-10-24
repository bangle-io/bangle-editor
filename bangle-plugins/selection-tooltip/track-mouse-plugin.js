import { domEventListener } from 'bangle-core/utils/js-utils';
import { viewHasFocus } from '../helpers/index';
import { Plugin } from 'prosemirror-state';
import {
  hideTooltip,
  showTooltip,
} from 'bangle-plugins/tooltip-placement/index';

const LOG = false;
let log = LOG
  ? console.log.bind(console, 'plugins/tooltip-show-hide')
  : () => {};

export function trackMousePlugin({
  tooltipDOM,
  tooltipPlugin,
  shouldShowTooltip,
}) {
  const plugin = new Plugin({
    view: (view) => {
      return new TooltipView(view);
    },
  });

  class TooltipView {
    constructor(view) {
      this._view = view;
      this._mouseDownState = new MouseDownState(view.dom, () => {
        this.update(view);
      });
      this._destroyWatchClickOutside = null;
    }

    _watchClickOutside = () => {
      if (this._destroyWatchClickOutside) {
        return;
      }

      const onClickOutside = (e) => {
        if (!this._view.dom) {
          return;
        }
        if (
          this._view.dom.contains(e.target) ||
          tooltipDOM.contains(e.target)
        ) {
          return;
        }
        // clicked outside
        else {
          log('clicked outside hiding');
          this._hide();
          if (this._destroyWatchClickOutside) {
            this._destroyWatchClickOutside();
          }
        }
      };

      // TODO move these to use {once: true} option of addEventListener
      document.addEventListener('click', onClickOutside);

      this._destroyWatchClickOutside = () => {
        if (this._destroyWatchClickOutside) {
          document.removeEventListener('click', onClickOutside);
          this._destroyWatchClickOutside = null;
        }
      };
    };

    _show() {
      // in case of show we want to trigger it every time
      // so that the we can update the position
      log('show');
      this._watchClickOutside();
      showTooltip(tooltipPlugin)(
        this._view.state,
        this._view.dispatch,
        this._view,
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
      log('updating');
      if (!viewHasFocus(view)) {
        this._hide();
        log('hiding lost focus');
        return;
      }

      if (this._mouseDownState.isDown) {
        log('hiding mouse down');
        this._hide();
      } else {
        log('showing mouse up');
        if (shouldShowTooltip(state)) {
          this._show();
        } else {
          this._hide();
        }
      }
    }

    destroy() {
      this._mouseDownState.destroy();
      if (this._destroyWatchClickOutside) {
        this._destroyWatchClickOutside();
      }
    }

    _hide() {
      if (this._destroyWatchClickOutside) {
        this._destroyWatchClickOutside();
      }
      hideTooltip(tooltipPlugin)(
        this._view.state,
        this._view.dispatch,
        this._view,
      );
    }
  }

  return { plugin };
}

// TODO debounce this and other high intensity ops
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
