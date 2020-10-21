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
    const { tooltipDOM, tooltipContent } = createTooltipDOM();
    return {
      tooltipDOM: tooltipDOM,
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

export function createTooltipDOM(className = 'bangle-tooltip') {
  const tooltipDOM = document.createElement('div');
  tooltipDOM.className = className;
  tooltipDOM.setAttribute('role', 'tooltip');
  const tooltipContent = document.createElement('div');
  tooltipContent.className = className + '-content';
  tooltipDOM.appendChild(tooltipContent);
  return { tooltipDOM, tooltipContent };
}
