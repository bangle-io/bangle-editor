import { DOMSerializer } from '@banglejs/core/prosemirror/model';

export function createTooltipDOM(
  tooltipDOMSpec = [
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
  ],
  arrow,
) {
  const { dom, contentDOM } = DOMSerializer.renderSpec(
    window.document,
    tooltipDOMSpec,
  );

  if (arrow && !dom.querySelector('.bangle-tooltip-arrow')) {
    const arrowElement = DOMSerializer.renderSpec(window.document, [
      'div',
      {
        'class': 'bangle-tooltip-arrow',
        'data-popper-arrow': '',
      },
    ]);
    dom.appendChild(arrowElement);
  }
  return { dom, contentDOM };
}
