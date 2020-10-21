import './inline-menu.css';
import { SelectionTooltip } from 'bangle-plugins/selection-tooltip/index';

export function inlineMenu(tooltipDOM) {
  const tooltipContent = document.createElement('div');
  tooltipDOM.className = 'bangle-inline-menu bangle-tooltip';
  tooltipDOM.setAttribute('role', 'tooltip');
  const tooltipArrow = document.createElement('div');
  tooltipDOM.appendChild(tooltipArrow);
  tooltipDOM.appendChild(tooltipContent);

  return new SelectionTooltip({
    tooltipDOM,
    getScrollContainerDOM: (view) => {
      return view.dom.parentElement.parentElement;
    },
  });
}
