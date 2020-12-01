import { objectFilter } from './js-utils';

/**
 * Creates a bare bone `toDOM` and `parseDOM` handlers for the PM schema.
 * The use case is for nodes or marks who already have a nodeView
 * and want to get basic `toDOM`, `parseDOM` to enable drag n drop or
 * copy paste.
 *
 * @param {*} spec
 * @param {Object} opts
 * @param {string} opts.tag
 * @param {string|0|(node)=>string} opts.content - `0` signals content that PM will inject.
 * @param {string} opts.ignoreAttrs
 * @param {Number} opts.parsingPriority https://prosemirror.net/docs/ref/#model.ParseRule.priority
 */
export function domSerializationHelpers(
  name,
  { tag = 'div', content, ignoreAttrs = [], parsingPriority = 51 } = {},
) {
  const serializer = (node) =>
    JSON.stringify(
      objectFilter(
        node.attrs || {},
        (value, key) => !ignoreAttrs.includes(key),
      ),
    );

  return {
    toDOM: (node) => {
      const domSpec = [
        tag,
        {
          'data-bangle-name': name,
          'data-bangle-attrs': serializer(node),
        },
      ];

      if (content !== undefined) {
        if (typeof content === 'function') {
          domSpec.push(content(node));
        } else {
          domSpec.push(content);
        }
      }

      return domSpec;
    },
    parseDOM: [
      {
        priority: parsingPriority,
        tag: `${tag}[data-bangle-name="${name}"]`,
        getAttrs: (dom) => {
          const attrs = dom.getAttribute('data-bangle-attrs');
          if (!attrs) {
            return {};
          }
          return JSON.parse(attrs);
        },
      },
    ],
  };
}
