/// <reference path="./missing-types.d.ts" />
import { DOMSerializer, DOMOutputSpec } from 'prosemirror-model';

export interface TooltipDOM {
  dom: HTMLElement;
  contentDOM: HTMLElement;
}

export function createTooltipDOM(
  tooltipDOMSpec: DOMOutputSpec = [
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
  arrow: boolean = false,
): TooltipDOM {
  const { dom, contentDOM } = DOMSerializer.renderSpec(
    window.document,
    tooltipDOMSpec,
  ) as TooltipDOM;

  if (arrow && !dom.querySelector('.bangle-tooltip-arrow')) {
    const arrowElement = DOMSerializer.renderSpec(window.document, [
      'div',
      {
        'class': 'bangle-tooltip-arrow',
        'data-popper-arrow': '',
      },
    ]);
    dom.appendChild(arrowElement.dom);
  }
  return { dom, contentDOM };
}
