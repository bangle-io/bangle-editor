import { Extension } from 'bangle-core/extensions/index';
import { trackMousePlugin } from './track-mouse.plugin';
import { selectionTooltipPlacementPlugin } from './selection-tooltip-placement.plugin';
const LOG = false;
let log = LOG ? console.log.bind(console, 'plugins/tooltip') : () => {};

export class SelectionTooltip extends Extension {
  get name() {
    return 'tooltip';
  }

  get defaultOptions() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return {
      tooltipDOM: createTooltipDOM(),
      defaultTooltipStatePmPlugin: true,
      getScrollContainerDOM: (view) => {
        return view.dom.parentElement;
      },
      tooltipOffset: (view) => {
        return [0, 0.5 * rem];
      },
    };
  }

  get plugins() {
    const { plugin, key } = selectionTooltipPlacementPlugin({
      tooltipOffset: this.options.tooltipOffset,
      tooltipDOM: this.options.tooltipDOM,
      getScrollContainerDOM: this.options.getScrollContainerDOM,
    });
    return [
      plugin,
      trackMousePlugin({
        tooltipPlacementKey: key,
        tooltipDOM: this.options.tooltipDOM,
      }).plugin,
    ];
  }
}

export function createTooltipDOM() {
  const tooltip = document.createElement('div');
  tooltip.id = 'bangle-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  const tooltipArrow = document.createElement('div');
  tooltipArrow.id = 'bangle-tooltip-arrow';
  tooltipArrow.setAttribute('data-popper-arrow', true);
  tooltip.appendChild(tooltipArrow);
  const tooltipContent = document.createElement('div');
  tooltipContent.textContent = 'hello world';
  tooltip.appendChild(tooltipContent);
  return tooltip;
}
