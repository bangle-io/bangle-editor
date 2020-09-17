import { PluginKey, Plugin } from 'prosemirror-state';
import { createPopper } from '@popperjs/core/lib/popper-lite';
import offset from '@popperjs/core/lib/modifiers/offset';
import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow';

import { domEventListener } from 'bangle-core/utils/js-utils';
import { Extension } from 'bangle-core/extensions/index';

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

export class SelectionTooltip extends Extension {
  get name() {
    return 'selection_tooltip';
  }

  get defaultOptions() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    return {
      offset: (view, placement) => {
        let skidding = 0;
        if (placement === 'top') {
          skidding = 1 * rem;
        }
        if (placement === 'bottom') {
          skidding = 2.5 * rem;
        }
        return [2 * rem, skidding];
      },
      tooltip: undefined,
      tooltipContent: (view) => {
        const tooltipContent = document.createElement('div');
        tooltipContent.textContent = 'hello world';
        return tooltipContent;
      },
    };
  }

  get plugins() {
    const plugin = new PluginKey(this.name);
    return [
      new Plugin({
        key: plugin,
        view: (editorView) => {
          return new TooltipPlugin(editorView, {
            offset: this.options.offset,
            tooltip: this.options.tooltip,
            tooltipContent: this.options.tooltipContent,
          });
        },
      }),
    ];
  }
}

class TooltipPlugin {
  constructor(view, options) {
    this._options = options;
    this._view = view;
    if (this._options.tooltip) {
      this._tooltip = this._options.tooltip(view);
    } else {
      this._tooltip = createTooltip();
      this._tooltip.appendChild(this._options.tooltipContent());
    }
    view.dom.parentNode.appendChild(this._tooltip);

    this._showHideTooltip = new ShowHideTooltip(view, {
      show: this._showTooltip,
      hide: this._hideTooltip,
      destroy: this._destroyPopperInstance,
    });

    this.update(view, null);
  }

  update(view, lastState) {
    if (view.state.selection.empty) {
      this._destroyPopperInstance();
      return;
    }
    this._createPopperInstance(view);
    this._showHideTooltip.update(view, lastState);
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
                return this._options.offset(view, placement);
              },
            },
          },
        ],
      },
    );
  }

  _destroyPopperInstance = () => {
    this._hideTooltip();
    if (this._popperInstance) {
      this._popperInstance.destroy();
      this._popperInstance = null;
    }
  };

  _showTooltip = () => {
    this._tooltip.setAttribute('data-show', '');
    if (this._popperInstance) {
      this._figurePlacement(this._view);
      this._popperInstance.update();
    }
  };

  _hideTooltip = () => {
    this._tooltip.removeAttribute('data-show');
  };
}

class ShowHideTooltip {
  constructor(view, options) {
    this._options = options;
    this._mouseDownState = new MouseDownState(view.dom, () => {
      this.update(view);
    });

    this._blurHandler = domEventListener(
      view.dom,
      'blur',
      () => {
        this._options.destroy();
      },
      {
        passive: true,
      },
    );
  }

  update(view, lastState) {
    let state = view.state;
    // Don't do anything if the document/selection didn't change
    if (
      lastState &&
      lastState.doc.eq(state.doc) &&
      lastState.selection.eq(state.selection)
    ) {
      return;
    }

    if (state.selection.empty) {
      this._options.destroy();
      return;
    }

    if (this._mouseDownState.isDown) {
      this._options.hide();
    } else {
      this._options.show();
    }
  }

  destroy() {
    this._mouseDownState.destroy();
    this._blurHandler();
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
