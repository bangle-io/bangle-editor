import { Plugin } from 'prosemirror-state';
import { matchAllPlus } from '../utils/js-utils';
import { filter, getMarkAttrs, mapSlice } from '../utils/pm-utils';

const LOG = false;

let log = LOG ? console.log.bind(console, 'components/link') : () => {};

const name = 'link';

const getTypeFromSchema = (schema) => schema.marks[name];

export const spec = (opts = {}) => {
  return {
    type: 'mark',
    name,
    schema: {
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
    },
    markdown: {
      toMarkdown: {
        open(_state, mark, parent, index) {
          return isPlainURL(mark, parent, index, 1) ? '<' : '[';
        },
        close(state, mark, parent, index) {
          return isPlainURL(mark, parent, index, -1)
            ? '>'
            : '](' +
                state.esc(mark.attrs.href) +
                (mark.attrs.title ? ' ' + state.quote(mark.attrs.title) : '') +
                ')';
        },
      },
      parseMarkdown: {
        link: {
          mark: 'link',
          getAttrs: (tok) => ({
            href: tok.attrGet('href'),
            title: tok.attrGet('title') || null,
          }),
        },
      },
    },
  };
};

export const plugins = ({ openOnClick = true, keybindings = {} } = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      pasteLinkify(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
      ),
      markPasteRule(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
        type,
        (match) => ({ href: match }),
      ),
      !openOnClick &&
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
  };
};

/**
 * Helpers
 */

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
        return createLink(text)(state, dispatch);
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
          return matches.map(({ start, end, match, subString }) => {
            let newNode = node.cut(start, end);
            if (match) {
              var attrs =
                getAttrs instanceof Function ? getAttrs(subString) : getAttrs;
              newNode = newNode.mark(type.create(attrs).addToSet(node.marks));
            }
            return newNode;
          });
        });
      },
    },
  });
}

function isPlainURL(link, parent, index, side) {
  if (link.attrs.title || !/^\w+:/.test(link.attrs.href)) {
    return false;
  }
  let content = parent.child(index + (side < 0 ? -1 : 0));
  if (
    !content.isText ||
    content.text !== link.attrs.href ||
    content.marks[content.marks.length - 1] !== link
  ) {
    return false;
  }
  if (index === (side < 0 ? 1 : parent.childCount - 1)) {
    return true;
  }
  let next = parent.child(index + (side < 0 ? -2 : 1));
  return !link.isInSet(next.marks);
}

function isTextAtPos(pos) {
  return (state) => {
    const node = state.doc.nodeAt(pos);
    return !!node && node.isText;
  };
}

function setLink(from, to, href) {
  href = href?.trim();
  return filter(
    (state) => isTextAtPos(from)(state),
    (state, dispatch) => {
      const linkMark = state.schema.marks.link;
      let tr = state.tr.removeMark(from, to, linkMark);
      if (href) {
        const mark = state.schema.marks.link.create({
          href: href,
        });
        tr.addMark(from, to, mark);
      }
      dispatch(tr);
      return true;
    },
  );
}

/**
 *
 * Commands
 *
 */

/**
 * Sets the selection to href
 * @param {*} href
 */
export function createLink(href) {
  return filter(
    (state) =>
      canLinkBeCreatedInRange(
        state.selection.$from.pos,
        state.selection.$to.pos,
      )(state),
    (state, dispatch) => {
      const [from, to] = [state.selection.$from.pos, state.selection.$to.pos];
      const linkMark = state.schema.marks.link;
      let tr = state.tr.removeMark(from, to, linkMark);

      if (href.trim()) {
        const mark = state.schema.marks.link.create({
          href: href,
        });
        tr.addMark(from, to, mark);
      }

      dispatch(tr);
      return true;
    },
  );
}

export function setLinkAtSelection(href) {
  return (state, dispatch) => {
    if (!state.selection.empty) {
      return setLink(
        state.selection.$from.pos,
        state.selection.$to.pos,
        href,
      )(state, dispatch);
    }

    const { $from } = state.selection;
    const pos = $from.pos - $from.textOffset;
    const node = state.doc.nodeAt(pos);
    let to = pos;

    if (node) {
      to += node.nodeSize;
    }

    return setLink(pos, to, href)(state, dispatch);
  };
}

export function getLinkMarkDetails(state) {
  const { $from } = state.selection;

  const pos = $from.pos - $from.textOffset;

  const $pos = state.doc.resolve(pos);
  const node = state.doc.nodeAt(pos);
  const { nodeAfter } = $pos;

  if (!nodeAfter) {
    return;
  }

  const type = state.schema.marks.link;

  const mark = type.isInSet(nodeAfter.marks || []);

  if (mark) {
    return {
      href: mark.attrs.href,
      text: node.textContent,
    };
  }
}

export function canLinkBeCreatedInRange(from, to) {
  return (state) => {
    const $from = state.doc.resolve(from);
    const $to = state.doc.resolve(to);
    const link = state.schema.marks.link;
    if ($from.parent === $to.parent && $from.parent.isTextblock) {
      return $from.parent.type.allowsMarkType(link);
    }
  };
}

export const isSelectionInsideLink = (state) =>
  !!state.doc.type.schema.marks.link.isInSet(state.selection.$from.marks());

export const isSelectionAroundLink = (state) => {
  const { $from, $to } = state.selection;
  const node = $from.nodeAfter;

  return (
    !!node &&
    $from.textOffset === 0 &&
    $to.pos - $from.pos === node.nodeSize &&
    !!state.doc.type.schema.marks.link.isInSet(node.marks)
  );
};
