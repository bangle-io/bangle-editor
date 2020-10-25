import React, { useEffect, useRef } from 'react';

import {
  SelectionTooltip,
  createTooltipDOM,
} from 'bangle-plugins/selection-tooltip/index';
import reactDOM from 'react-dom';

export function InlineMenuRange({ menuDOM, getScrollContainerDOM }) {
  const { tooltipDOM, tooltipContent } = createTooltipDOM();

  tooltipContent.appendChild(menuDOM);

  const inlineSuggest = new SelectionTooltip({
    tooltipName: 'inline_menu_range_tooltip',
    tooltipDOM,
    getScrollContainerDOM,
    onHideTooltip: () => {
      return true;
    },

    onUpdateTooltip(state, dispatch, view) {
      let { head, from } = state.selection;
      if (this.popperInstance) {
        if (head === from) {
          this.popperInstance.setOptions({ placement: 'top' });
        } else {
          this.popperInstance.setOptions({ placement: 'bottom' });
        }
      }
      return true;
    },

    shouldShowTooltip: (state) => !state.selection.empty,
  });

  return inlineSuggest;
}
