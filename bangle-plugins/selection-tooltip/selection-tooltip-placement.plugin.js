import { tooltipPlacementPlugin } from '../tooltip-placement/index';

const LOG = false;
let log = LOG
  ? console.log.bind(console, 'plugins/selection-tooltip-placement')
  : () => {};

export function selectionTooltipPlacementPlugin({
  tooltipOffset,
  tooltipDOM,
  getScrollContainerDOM,
  pluginName = 'selectionTooltipPlacementPlugin',
}) {
  const { plugin, key } = tooltipPlacementPlugin({
    pluginName,
    tooltipOffset,
    tooltipDOM,
    getScrollContainerDOM,
    virtualElement: selectionVirtualElement,
    onShowTooltip: (view, popperInstance) => {
      let { head, from } = view.state.selection;
      if (head === from) {
        popperInstance.setOptions({ placement: 'top' });
      } else {
        popperInstance.setOptions({ placement: 'bottom' });
      }
    },
  });
  return { plugin, key };
}

export function selectionVirtualElement(view, tooltipDOM, scrollContainerDOM) {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

  return {
    getBoundingClientRect: () => {
      let { head } = view.state.selection;

      const start = view.coordsAtPos(head);
      let { top, bottom, left, right } = start;
      const scrollContainersRect = scrollContainerDOM.getBoundingClientRect();
      const tooltipRect = tooltipDOM.getBoundingClientRect();
      // added 1 rem to offset the fact that it will be dealt tooltipOffset
      // which adds an offset pushing the tooltip to go out of viewport
      let height = tooltipRect.height + 1 * rem;

      // if we bleed outside the scroll container, pull it back
      // so its inside
      if (scrollContainersRect.bottom - bottom < height) {
        top = scrollContainersRect.bottom - 2 * height;
        bottom = scrollContainersRect.bottom - 1 * height;
        right = left;
      }

      return {
        width: right - left,
        height: bottom - top,
        top: top,
        right: left,
        bottom: bottom,
        left: left,
      };
    },
  };
}
