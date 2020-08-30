import { Plugin } from 'prosemirror-state';
import { updateMark, removeMark } from 'tiptap-commands';
import { getMarkAttrs } from 'tiptap-utils';

import { Mark } from './mark';
import { matchAllPlus } from '../utils/js-utils';
import { mapSlice } from '../utils/pm-utils';

const LOG = true;

let log = LOG ? console.log.bind(console, 'marks/link') : () => {};

export class Link extends Mark {
  get name() {
    return 'link';
  }

  get defaultOptions() {
    return {
      openOnClick: true,
    };
  }

  get schema() {
    return {
      attrs: {
        href: {
          default: null,
        },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs: (dom) => ({
            href: dom.getAttribute('href'),
          }),
        },
      ],
      toDOM: (node) => [
        'a',
        {
          ...node.attrs,
          rel: 'noopener noreferrer nofollow',
        },
        0,
      ],
    };
  }

  commands({ type }) {
    return (attrs) => {
      if (attrs.href) {
        return updateMark(type, attrs);
      }

      return removeMark(type);
    };
  }

  pasteRules({ type }) {
    return [
      markPasteRule(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
        type,
        (match) => ({ href: match }),
      ),
    ];
  }

  get plugins() {
    if (!this.options.openOnClick) {
      return [];
    }

    return [
      pasteLinkify(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
      ),
      new Plugin({
        props: {
          handleClick: (view, pos, event) => {
            const { schema } = view.state;
            const attrs = getMarkAttrs(view.state, schema.marks.link);

            if (attrs.href && event.target instanceof HTMLAnchorElement) {
              event.stopPropagation();
              window.open(attrs.href);
            }
          },
        },
      }),
    ];
  }
}

function pasteLinkify(regexp) {
  return new Plugin({
    props: {
      handlePaste: function handlePastedLink(view, rawEvent, slice) {
        const event = rawEvent;
        if (!event.clipboardData) {
          return false;
        }
        let text = event.clipboardData.getData('text/plain');
        const html = event.clipboardData.getData('text/html');

        const isPlainText = text && !html;

        if (!isPlainText || view.state.selection.empty) {
          return false;
        }

        const { state, dispatch } = view;
        const match = matchAllPlus(regexp, text);
        const singleMatch = match.length === 1 && match.every((m) => m.match);
        // Only handle if paste has one URL
        if (!singleMatch) {
          return false;
        }

        const [from, to] = [state.selection.$from.pos, state.selection.$to.pos];
        const tr = state.tr;
        const mark = state.schema.marks.link.create({
          href: text,
        });
        tr.addMark(from, to, mark);
        dispatch(tr);

        return true;
      },
    },
  });
}

function markPasteRule(regexp, type, getAttrs) {
  return new Plugin({
    props: {
      transformPasted: function transformPasted(slice) {
        return mapSlice(slice, (node) => {
          if (!node.isText) {
            return node;
          }
          const text = node.text;
          const matches = matchAllPlus(regexp, text);
          return matches.map(({ start, end, match, matchedStr }) => {
            let newNode = node.cut(start, end);
            if (match) {
              var attrs =
                getAttrs instanceof Function ? getAttrs(matchedStr) : getAttrs;
              newNode = newNode.mark(type.create(attrs).addToSet(node.marks));
            }
            return newNode;
          });
        });
      },
    },
  });
}
