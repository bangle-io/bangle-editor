import { Extension } from 'bangle-core/extensions/index';
import { tooltipShowHidePlugin } from './tooltip-show-hide.plugin';
import { tooltipPlacementPlugin } from './tooltip-placement.plugin';
const LOG = false;
let log = LOG ? console.log.bind(console, 'plugins/tooltip') : () => {};

export class Tooltip extends Extension {
  get name() {
    return 'tooltip';
  }

  get defaultOptions() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return {
      tooltipDOM: createTooltipDOM(),
      defaultTooltipStatePmPlugin: true,
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
    const {
      plugin: tooltipPlacementPluginInstance,
      key,
    } = tooltipPlacementPlugin({
      tooltipOffset: this.options.tooltipOffset,
      tooltipDOM: this.options.tooltipDOM,
    });
    return [
      tooltipPlacementPluginInstance,
      tooltipShowHidePlugin({
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
