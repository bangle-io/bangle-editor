import './inline-menu.css';
import { InlineMenu } from 'bangle-plugins/inline-menu/index';

export function inlineMenu(menuDOM) {
  return InlineMenu({
    menuDOM,
    getScrollContainerDOM: (view) => {
      return view.dom.parentElement.parentElement;
    },
  });
}
