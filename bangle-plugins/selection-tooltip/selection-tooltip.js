import { PluginKey, Plugin } from 'prosemirror-state';
import { createPopper } from '@popperjs/core/lib/popper-lite';
import offset from '@popperjs/core/lib/modifiers/offset';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';

import { Extension } from 'bangle-core/extensions/index';
import { SelectionTooltipManager } from './selection-tooltip-manager';

export function createTooltip() {
  const tooltip = document.createElement('div');
  tooltip.id = 'bangle-selection-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  const tooltipArrow = document.createElement('div');
  tooltipArrow.id = 'bangle-tooltip-arrow';
  tooltipArrow.setAttribute('data-popper-arrow', true);
  tooltip.appendChild(tooltipArrow);
  return tooltip;
}
export const selectionTooltipKey = new PluginKey('selection_tooltip_key');

export class SelectionTooltip extends Extension {
  get name() {
    return 'selection_tooltip';
  }

  get defaultOptions() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    return {
      tooltipDom: undefined,
      defaultTooltipManager: true,
      tooltipContent: (view) => {
        const tooltipContent = document.createElement('div');
        tooltipContent.textContent = 'hello world';
        return tooltipContent;
      },
      tooltipOffset: (view, placement) => {
        let skidding = 0;
        if (placement === 'top') {
          skidding = 1 * rem;
        }
        if (placement === 'bottom') {
          skidding = 2.5 * rem;
        }
        return [2 * rem, skidding];
      },
    };
  }

  get plugins() {
    return [
      new Plugin({
        key: selectionTooltipKey,
        view: (editorView) => {
          return new TooltipPlugin(editorView, {
            tooltipOffset: this.options.tooltipOffset,
            tooltipDom: this.options.tooltipDom,
            tooltipContent: this.options.tooltipContent,
          });
        },
        state: {
          init: (_, state) => {
            return {
              show: state.selection.empty,
            };
          },
          apply: (tr, value) => {
            if (tr.getMeta(selectionTooltipKey)) {
              return tr.getMeta(selectionTooltipKey);
            }
            return value;
          },
        },
      }),
      this.options.defaultTooltipManager &&
        new Plugin({
          view: (editorView) => {
            return new SelectionTooltipManager(editorView);
          },
        }),
    ].filter(Boolean);
  }
}

class TooltipPlugin {
  constructor(view, options) {
    this._options = options;
    this._view = view;
    if (this._options.tooltipDom) {
      this._tooltip = this._options.tooltipDom(view);
    } else {
      this._tooltip = createTooltip();
      this._tooltip.appendChild(this._options.tooltipContent());
    }
    view.dom.parentNode.appendChild(this._tooltip);
  }

  update(view, prevState) {
    const pluginState = selectionTooltipKey.getState(view.state);
    if (pluginState === selectionTooltipKey.getState(prevState)) {
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
          {
            name: 'offset',
            options: {
              offset: ({ placement }) => {
                return this._options.tooltipOffset(view, placement);
              },
            },
          },
        ],
      },
    );
  }
}
