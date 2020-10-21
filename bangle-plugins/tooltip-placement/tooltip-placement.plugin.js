import { createPopper } from '@popperjs/core/lib/popper-lite';
import offset from '@popperjs/core/lib/modifiers/offset';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import flip from '@popperjs/core/lib/modifiers/flip';
import arrow from '@popperjs/core/lib/modifiers/arrow';
import popperOffsets from '@popperjs/core/lib/modifiers/popperOffsets';
import { Plugin, PluginKey } from 'prosemirror-state';

const LOG = false;
let log = LOG
  ? console.log.bind(console, 'tooltip/tooltip-placement')
  : () => {};

/**
 * Dispatching show: true to the plugin will also update the tooltip position
 * Note: the state is interesting as it maintains the reference to the same state object if state is and was false
 * however any {show:true} dispatches will generate a new state object for easier reference checks. In a way
 * the state ref can be used to see if the position of tooltip has updated.
 *
 * To show a tooltip appendChild a div element to tooltipDOM with [data-popper-arrow] attribute
 *
 * @param {Object} options - The shape is the same as SpecialType above
 * @param {string} options.pluginName
 * @param {Element} options.tooltipDOM
 * @param {(view: any) => Element} options.getScrollContainerDOM
 * @param {(view: any, tooltipDOM: Element, scrollContainerDOM: Element) => {getBoundingClientRect: Function}} options.getReferenceElement
 * @param {string} options.placement
 * @param {(view: any, popperState: any) => [number, number]} options.tooltipOffset
 * @param {(view: any, popperInstance: any) => void} options.onShowTooltip
 * @param {(view: any) => void} options.onHideTooltip
 * @param {(view: any) => Array} options.customModifiers
 * @param {(state: any) => Boolean} options.getInitialShowState
 * @param {Array} options.fallbackPlacement
 */
export function tooltipPlacementPlugin({
  pluginName = 'tooltipPlacementPlugin',
  tooltipDOM,
  getScrollContainerDOM,
  getReferenceElement,
  placement = 'top',
  tooltipOffset,
  onShowTooltip = (view, popperInstance) => {},
  onHideTooltip = (view) => {},
  customModifiers,
  fallbackPlacements = ['bottom', 'top'],
  getInitialShowState = (state) => false,
}) {
  const key = new PluginKey(pluginName);

  const plugin = new Plugin({
    key: key,
    view: (view) => {
      return new TooltipPlacementView(view);
    },
    state: {
      init: (_, state) => {
        return {
          show: getInitialShowState(state),
        };
      },
      apply: (tr, pluginState) => {
        if (!tr.getMeta(key)) {
          return pluginState;
        }

        const newState = tr.getMeta(key);
        // Do not change object reference if 'show' was and is false
        if (newState.show === false && newState.show === pluginState.show) {
          return pluginState;
        }

        return newState;
      },
    },
  });

  class TooltipPlacementView {
    constructor(view) {
      this._view = view;
      this._tooltip = tooltipDOM;
      this._scrollContainerDOM = getScrollContainerDOM(view);
      // TODO should this be this plugins responsibility
      this._view.dom.parentNode.appendChild(this._tooltip);

      const pluginState = key.getState(view.state);
      // if the initial state is to show, setup the tooltip
      if (pluginState.show) {
        this._showTooltip();
        return;
      }
    }

    update(view, prevState) {
      const pluginState = key.getState(view.state);
      if (pluginState === key.getState(prevState)) {
        return;
      }
      log('received ', pluginState.show);
      if (pluginState.show) {
        this._showTooltip();
      } else {
        this._hideTooltip();
      }
    }

    destroy() {
      if (this._showHideTooltip) {
        this._showHideTooltip.destroy();
        this._showHideTooltip = null;
      }
      if (this._popperInstance) {
        this._popperInstance.destroy();
        this._popperInstance = null;
      }

      this._view.dom.parentNode.removeChild(this._tooltip);
    }

    _hideTooltip = () => {
      log('hiding');
      if (this._popperInstance) {
        this._tooltip.removeAttribute('data-show');
        this._popperInstance.destroy();
        this._popperInstance = null;
        onHideTooltip(this._view);
      }
    };

    _showTooltip = () => {
      this._tooltip.setAttribute('data-show', '');
      this._createPopperInstance(this._view);
      this._popperInstance.update();
    };

    _createPopperInstance(view) {
      if (this._popperInstance) {
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
              return tooltipOffset(view, popperState);
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

      this._popperInstance = createPopper(
        getReferenceElement(view, this._tooltip, this._scrollContainerDOM),
        this._tooltip,
        {
          placement,
          modifiers: customModifiers
            ? customModifiers(
                view,
                this._tooltip,
                this._scrollContainerDOM,
                defaultModifiers,
              )
            : defaultModifiers,
        },
      );

      onShowTooltip(view, this._popperInstance);
    }
  }

  return { plugin, key: key };
}
