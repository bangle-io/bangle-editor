import { DOMOutputSpec, DOMSerializer } from 'prosemirror-model';

export function createElement(spec: DOMOutputSpec): HTMLElement {
  const { dom, contentDOM } = DOMSerializer.renderSpec(window.document, spec);
  if (contentDOM) {
    throw new Error('createElement does not support creating contentDOM');
  }
  return dom as HTMLElement;
}
