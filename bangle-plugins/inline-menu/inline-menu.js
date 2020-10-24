import React, { useEffect, useRef } from 'react';

import {
  SelectionTooltip,
  createTooltipDOM,
} from 'bangle-plugins/selection-tooltip/index';
import reactDOM from 'react-dom';

/**
 *
 * @param {Object} options
 * @param {'range' | 'fixed'} options.type
 *
 */
export function InlineMenu({ type = 'range', ...args } = {}) {
  if (type === 'range') {
    return InlineMenuRange(args);
  }

  // If a selection is inside mark completely
  if (type === 'mark') {
    return InlineMarkMenu(args);
  }
}

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

export function InlineMarkMenu({ getScrollContainerDOM }) {
  const { tooltipDOM, tooltipContent } = createTooltipDOM();
  const render = (state, dispatch, view) => {
    const result = getLinkText(state);
    console.log(result);
    reactDOM.render(
      <span>
        {result && result.text} {result && result.href}
      </span>,
      tooltipContent,
    );

    return true;
  };

  const inlineSuggest = new SelectionTooltip({
    tooltipName: 'inline_mark_tooltip',
    tooltipDOM,
    getScrollContainerDOM,
    placement: 'top',

    shouldShowTooltip: (state) => {
      const type = state.schema.marks.link;
      const { $from, empty } = state.selection;
      if (empty) {
        const { nodeBefore } = $from;
        if (!nodeBefore) {
          return false;
        }

        return Boolean(type.isInSet(nodeBefore.marks || []));
      }
      return false;
    },

    onHideTooltip: () => {
      reactDOM.unmountComponentAtNode(tooltipContent);
      return true;
    },

    onUpdateTooltip: (state, dispatch, view) => {
      return render(state, dispatch, view);
    },
  });

  return inlineSuggest;
}

function getLinkText(state) {
  const { nodeBefore, nodeAfter } = state.selection.$from;

  if (!nodeBefore) {
    return;
  }

  let text = nodeBefore.text;

  const type = state.schema.marks.link;

  const mark = type.isInSet(nodeBefore.marks || []);

  if (nodeAfter && type.isInSet(nodeAfter.marks || [])) {
    const afterMark = type.isInSet(nodeAfter.marks || []);
    if (afterMark === mark) {
      text += nodeAfter.text;
    }
  }

  if (mark) {
    return {
      href: mark.attrs.href,
      text,
    };
  }
}
