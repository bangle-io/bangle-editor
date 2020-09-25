import './inline-menu.css';
import { Tooltip } from 'bangle-plugins/selection-tooltip/index';

export function inlineMenu(tooltipDOM) {
  const tooltipContent = document.createElement('div');
  tooltipDOM.id = 'bangle-inline-menu';
  tooltipDOM.setAttribute('role', 'tooltip');
  const tooltipArrow = document.createElement('div');
  tooltipDOM.appendChild(tooltipArrow);
  tooltipDOM.appendChild(tooltipContent);

  return new Tooltip({
    tooltipDOM,
  });
}
