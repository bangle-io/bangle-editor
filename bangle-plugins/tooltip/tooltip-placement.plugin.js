import { createPopper } from '@popperjs/core/lib/popper-lite';
import offset from '@popperjs/core/lib/modifiers/offset';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';
import flip from '@popperjs/core/lib/modifiers/flip';
import { Plugin, PluginKey } from 'prosemirror-state';

const LOG = false;
let log = LOG
  ? console.log.bind(console, 'plugins/tooltip-placement')
  : () => {};

export function tooltipPlacementPlugin({ tooltipOffset, tooltipDOM }) {
  const tooltipPlacementKey = new PluginKey('tooltipPlacementPlugin');

  const plugin = new Plugin({
    key: tooltipPlacementKey,
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
        if (tr.getMeta(tooltipPlacementKey)) {
          return tr.getMeta(tooltipPlacementKey);
        }
        return value;
      },
    },
  });
  class TooltipPlacementView {
    constructor(view) {
      this._view = view;
      this._tooltip = tooltipDOM;

      view.dom.parentNode.appendChild(this._tooltip);
    }

    update(view, prevState) {
      const pluginState = tooltipPlacementKey.getState(view.state);
      if (pluginState === tooltipPlacementKey.getState(prevState)) {
        return;
      }
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
      this._tooltip.removeAttribute('data-show');
      if (this._popperInstance) {
        this._popperInstance.destroy();
        this._popperInstance = null;
      }
    };

    _showTooltip = () => {
      this._tooltip.setAttribute('data-show', '');
      this._createPopperInstance(this._view);
      this._figurePlacement(this._view);
      this._popperInstance.update();
    };

    _createVirtualElement(view) {
      return {
        getBoundingClientRect: () => {
          const { head } = view.state.selection;
          const start = view.coordsAtPos(head);
          const left = start.left;
          const top = start.top;
          return {
            width: 0,
            height: 0,
            top: top,
            right: left,
            bottom: top,
            left: left,
          };
        },
      };
    }

    _figurePlacement(view) {
      let { head, from } = view.state.selection;
      if (head === from) {
        this._popperInstance.setOptions({ placement: 'top' });
      } else {
        this._popperInstance.setOptions({ placement: 'bottom' });
      }
    }

    _createPopperInstance(view) {
      if (this._popperInstance) {
        return;
      }

      this._popperInstance = createPopper(
        this._createVirtualElement(view, this._popperInstance),
        this._tooltip,
        {
          placement: 'top',
          modifiers: [
            offset,
            preventOverflow,
            flip,
            {
              name: 'offset',
              options: {
                offset: ({ placement }) => {
                  return tooltipOffset(view, placement);
                },
              },
            },
          ],
        },
      );
    }
  }

  return { plugin, key: tooltipPlacementKey };
}
