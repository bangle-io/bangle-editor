import './inline-menu.css';
import { SelectionTooltip } from 'bangle-plugins/selection-tooltip/index';

const cache = new WeakMap();

export class InlineMenu {
  tooltipContent = document.createElement('div');

  tooltipDom = (view) => {
    if (cache.has(view)) {
      return cache.get(view);
    }
    const tooltip = document.createElement('div');
    tooltip.id = 'bangle-inline-menu';
    tooltip.setAttribute('role', 'tooltip');
    const tooltipArrow = document.createElement('div');
    tooltip.appendChild(tooltipArrow);
    cache.set(view, tooltip);

    tooltip.appendChild(this.tooltipContent);
    return tooltip;
  };
  extensions() {
    return [
      new SelectionTooltip({
        tooltipDom: this.tooltipDom,
      }),
    ];
  }
}
