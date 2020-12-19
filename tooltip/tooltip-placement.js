import { Plugin } from '@banglejs/core/index';
import { bangleWarn } from '@banglejs/core/utils/js-utils';
import { createTooltipDOM } from './create-tooltip-dom';
import {
  createPopper,
  offset,
  preventOverflow,
  flip,
  arrow,
  popperOffsets,
} from './popper';

export const plugins = tooltipPlacement;

const LOG = false;
let log = LOG
  ? console.log.bind(console, 'tooltip/tooltip-placement')
  : () => {};

const rem =
  typeof window === 'undefined'
    ? 12
    : parseFloat(getComputedStyle(document.documentElement).fontSize);

function tooltipPlacement({
  stateKey,
  renderOpts: {
    tooltipDOMSpec,
    placement = 'top',
    getReferenceElement,
    getScrollContainer = (view) => {
      return view.dom.parentElement;
    },
    onUpdateTooltip = (state, dispatch, view) => {},
    onHideTooltip = (state, dispatch, view) => {},
    tooltipOffset = () => {
      return [0, 0.5 * rem];
    },
    fallbackPlacements = ['bottom', 'top'],
    customPopperModifiers,
  },
}) {
  const plugin = new Plugin({
    view: (view) => {
      return new TooltipPlacementView(view);
    },
  });

  class TooltipPlacementView {
    popperInstance = null;

    constructor(view) {
      this._view = view;

      const { dom: tooltipDOM } = createTooltipDOM(tooltipDOMSpec);

      this._tooltip = tooltipDOM;
      this._scrollContainerDOM = getScrollContainer(view);
      // TODO should this be this plugins responsibility
      this._view.dom.parentNode.appendChild(this._tooltip);

      const pluginState = stateKey.getState(view.state);
      validateState(pluginState);
      // if the initial state is to show, setup the tooltip
      if (pluginState.show) {
        this._showTooltip();
        return;
      }
    }

    update(view, prevState) {
      const pluginState = stateKey.getState(view.state);
      if (pluginState === stateKey.getState(prevState)) {
        return;
      }
      if (pluginState.show) {
        log('calling update toolip');
        onUpdateTooltip.call(this, view.state, view.dispatch, view);

        this._showTooltip();
      } else {
        log('calling hide tooltip');
        this._hideTooltip();
      }
    }

    destroy() {
      if (this.popperInstance) {
        this.popperInstance.destroy();
        this.popperInstance = null;
      }

      this._view.dom.parentNode.removeChild(this._tooltip);
    }

    _hideTooltip = () => {
      log('hiding');
      if (this.popperInstance) {
        this._tooltip.removeAttribute('data-show');
        this.popperInstance.destroy();
        this.popperInstance = null;
        onHideTooltip.call(
          this,
          this._view.state,
          this._view.dispatch,
          this._view,
        );
      }
    };

    _showTooltip = () => {
      this._tooltip.setAttribute('data-show', '');
      this._createPopperInstance(this._view);
      this.popperInstance.update();
    };

    _createPopperInstance(view) {
      if (this.popperInstance) {
        return;
      }

      const showTooltipArrow = this._tooltip.querySelector(
        '[data-popper-arrow]',
      );
      const defaultModifiers = [
        offset,
        preventOverflow,
        flip,
        {
          name: 'offset',
          options: {
            offset: (popperState) => {
              return tooltipOffset(popperState);
            },
          },
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements,
            padding: 10,
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: this._scrollContainerDOM,
          },
        },
        popperOffsets,
        showTooltipArrow ? arrow : undefined,
        showTooltipArrow
          ? {
              name: 'arrow',
              options: {
                element: showTooltipArrow,
              },
            }
          : undefined,
      ].filter(Boolean);

      this.popperInstance = createPopper(
        getReferenceElement(view, this._tooltip, this._scrollContainerDOM),
        this._tooltip,
        {
          placement,
          modifiers: customPopperModifiers
            ? customPopperModifiers(
                view,
                this._tooltip,
                this._scrollContainerDOM,
                defaultModifiers,
              )
            : defaultModifiers,
        },
      );
      onUpdateTooltip.call(this, view.state, view.dispatch, view);
    }
  }

  return plugin;
}

function validateState(state) {
  if (typeof state.show !== 'boolean') {
    bangleWarn(
      `Tooltip must be controlled by a plugin having a boolean field "show" in its state, but received the state=`,
      state,
    );
    throw new Error('"show" field required.');
  }
}
