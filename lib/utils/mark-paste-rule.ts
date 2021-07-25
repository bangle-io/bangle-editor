import { Fragment, Mark, MarkType, Node, Plugin, Slice } from '@bangle.dev/pm';

export function markPasteRule(
  regexp: RegExp,
  type: MarkType,
  getAttrs?: Mark['attrs'] | ((match: RegExpMatchArray) => Mark['attrs']),
) {
  const handler = (fragment: Fragment, parent?: Node) => {
    const nodes: Node[] = [];

    fragment.forEach((child) => {
      if (child.isText) {
        const { text, marks } = child;
        let pos = 0;
        let match;

        const isLink = !!marks.filter((x) => x.type.name === 'link')[0];

        while (!isLink && (match = regexp.exec(text!)) !== null) {
          if (parent && parent.type.allowsMarkType(type) && match[1]) {
            const start = match.index;
            const end = start + match[0].length;
            const textStart = start + match[0].indexOf(match[1]);
            const textEnd = textStart + match[1].length;
            const attrs =
              getAttrs instanceof Function ? getAttrs(match) : getAttrs;

            // adding text before markdown to nodes
            if (start > 0) {
              nodes.push(child.cut(pos, start));
            }

            // adding the markdown part to nodes
            nodes.push(
              child
                .cut(textStart, textEnd)
                .mark(type.create(attrs).addToSet(child.marks)),
            );

            pos = end;
          }
        }

        // adding rest of text to nodes
        if (pos < text!.length) {
          nodes.push(child.cut(pos));
        }
      } else {
        nodes.push(child.copy(handler(child.content, child)));
      }
    });

    return Fragment.fromArray(nodes);
  };

  return new Plugin({
    props: {
      transformPasted: (slice) =>
        new Slice(handler(slice.content), slice.openStart, slice.openEnd),
    },
  });
}
