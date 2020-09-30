import { createPopper } from '@popperjs/core/lib/popper-lite';
import offset from '@popperjs/core/lib/modifiers/offset';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import flip from '@popperjs/core/lib/modifiers/flip';
import { Plugin, PluginKey } from 'prosemirror-state';

const LOG = true;
let log = LOG
  ? console.log.bind(console, 'tooltip/tooltip-placement')
  : () => {};

/**
 *
 * @param {Object} options - The shape is the same as SpecialType above
 * @param {string} options.pluginName
 * @param {Element} options.tooltipDOM
 * @param {(view: any) => Element} options.getScrollContainerDOM
 * @param {(view: any, tooltipDOM: Element, scrollContainerDOM: Element) => {getBoundingClientRect: Function}} options.virtualElement
 * @param {string} options.placement
 * @param {(view: any, popperState: any) => [number, number]} options.tooltipOffset
 * @param {(view: any, popperInstance: any) => void} options.onShowTooltip
 * @param {(view: any) => void} options.onHideTooltip
 * @param {(view: any) => Array} options.customModifiers
 * @param {Array} options.fallbackPlacement
 */
export function tooltipPlacementPlugin({
  pluginName = 'tooltipPlacementPlugin',
  tooltipDOM,
  getScrollContainerDOM,
  virtualElement,
  placement = 'top',
  tooltipOffset,
  onShowTooltip = (view, popperInstance) => {},
  onHideTooltip = (view) => {},
  customModifiers,
  fallbackPlacements = ['bottom'],
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
          show: state.selection.empty,
        };
      },
      apply: (tr, value) => {
        if (tr.getMeta(key)) {
          return tr.getMeta(key);
        }
        return value;
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

      this._popperInstance = createPopper(
        virtualElement(view, this._tooltip, this._scrollContainerDOM),
        this._tooltip,
        {
          placement,
          modifiers: customModifiers
            ? customModifiers(view, this._tooltip, this._scrollContainerDOM)
            : [
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
                    padding: 5,
                  },
                },
                {
                  name: 'preventOverflow',
                  options: {
                    boundary: this._scrollContainerDOM,
                  },
                },
              ],
        },
      );

      onShowTooltip(view, this._popperInstance);
    }
  }

  return { plugin, key: key };
}
