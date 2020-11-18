import { DOMSerializer } from 'prosemirror-model';

export function createSelectionTooltipDOM(arrow = false) {
  const {
    dom: tooltipDOM,
    contentDOM: tooltipContentDOM,
  } = DOMSerializer.renderSpec(
    window.document,
    [
      'div',
      {
        class: 'bangle-tooltip',
        role: 'tooltip',
      },
      [
        'div',
        {
          class: 'bangle-tooltip-content',
        },
        0,
      ],
      arrow && [
        'div',
        {
          'class': 'bangle-tooltip-arrow',
          'data-popper-arrow': '',
        },
      ],
    ].filter(Boolean),
  );

  return { tooltipDOM, tooltipContentDOM };
}
