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
  ...opts
}) {
  const { plugin, key } = tooltipPlacementPlugin({
    ...opts,
    pluginName,
    tooltipOffset,
    tooltipDOM,
    getScrollContainerDOM,
    getReferenceElement: selectionVirtualElement,
    onShowTooltip: (view, popperInstance) => {
      let { head, from } = view.state.selection;
      if (head === from) {
        popperInstance.setOptions({ placement: 'top' });
      } else {
        popperInstance.setOptions({ placement: 'bottom' });
      }
    },
    getInitialShowState: (state) => state.selection.empty,
  });
  return { plugin, key };
}

export function selectionVirtualElement(view) {
  return {
    getBoundingClientRect: () => {
      let { head } = view.state.selection;

      const start = view.coordsAtPos(head);
      let { top, bottom, left, right } = start;

      return {
        width: right - left,
        height: bottom - top,
        top: top,
        right: right,
        bottom: bottom,
        left: left,
      };
    },
  };
}
