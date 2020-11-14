import { objectFilter } from './utils/js-utils';

/**
 * Creates a bare bone `toDOM` and `parseDOM` handlers for the PM schema.
 * The use case is for nodes or marks who already have a nodeView
 * and want to get basic `toDOM`, `parseDOM` to enable drag n drop or
 * copy paste.
 *
 * @param {*} spec
 * @param {Object} opts
 * @param {string} opts.tagName
 * @param {string} opts.ignoreAttrs
 * @param {Number} opts.parsingPriority https://prosemirror.net/docs/ref/#model.ParseRule.priority
 */
export function domSerializationHelpers(
  name,
  {
    tagName = 'div',
    hasContent = false,
    ignoreAttrs = [],
    parsingPriority,
  } = {},
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
        tagName,
        {
          'data-bangle-name': name,
          'data-bangle-attrs': serializer(node),
        },
      ];

      if (hasContent) {
        domSpec.push(0);
      }

      return domSpec;
    },
    parseDOM: [
      {
        priority: parsingPriority,
        tag: `${tagName}[data-bangle-name="${name}"]`,
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
