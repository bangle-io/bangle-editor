import { Extension } from 'bangle-core/extensions/index';
import { trackMousePlugin } from './track-mouse.plugin';
import { selectionTooltipPlacementPlugin } from './selection-tooltip-placement.plugin';
const LOG = false;
let log = LOG ? console.log.bind(console, 'plugins/tooltip') : () => {};

/**
 * Shows a tooltip when there is a selection
 */
export class SelectionTooltip extends Extension {
  get name() {
    return 'tooltip';
  }

  get defaultOptions() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const showTooltipArrow = true;
    const { tooltipDOM, tooltipContent } = createTooltipDOM(showTooltipArrow);
    tooltipContent.innerText = 'Hello I am a beautiful tooltip';
    return {
      tooltipDOM: tooltipDOM,
      defaultTooltipStatePmPlugin: true,
      getScrollContainerDOM: (view) => {
        return view.dom.parentElement;
      },
      tooltipOffset: (view) => {
        return [0, 0.5 * rem];
      },
      showTooltipArrow: showTooltipArrow,
    };
  }

  get plugins() {
    const { plugin, key } = selectionTooltipPlacementPlugin({
      tooltipOffset: this.options.tooltipOffset,
      tooltipDOM: this.options.tooltipDOM,
      getScrollContainerDOM: this.options.getScrollContainerDOM,
      showTooltipArrow: this.options.showTooltipArrow,
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

export function createTooltipDOM(arrow = false) {
  const tooltipDOM = document.createElement('div');
  tooltipDOM.className = 'bangle-tooltip bangle-selection-tooltip';
  tooltipDOM.setAttribute('role', 'tooltip');

  const tooltipContent = document.createElement('div');
  tooltipContent.className = 'bangle-tooltip-content';
  tooltipDOM.appendChild(tooltipContent);
  if (arrow) {
    const arrowDOM = document.createElement('div');
    arrowDOM.className = 'bangle-tooltip-arrow';
    arrowDOM.setAttribute('data-popper-arrow', '');
    tooltipDOM.appendChild(arrowDOM);
  }
  return { tooltipDOM, tooltipContent };
}
