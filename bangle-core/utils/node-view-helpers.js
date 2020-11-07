import { objectFilter } from './js-utils';

/**
 * @param {*} spec
 * @param {Object} opts
 * @param {string} opts.container
 */
export function serializationHelpers(
  spec,
  {
    allowedAttrs,
    container = spec.schema.inline ? 'span' : 'div',
    serializer = (node) =>
      JSON.stringify(
        allowedAttrs
          ? objectFilter(node.attrs, (value, key) => allowedAttrs.includes(key))
          : node.attrs,
      ),
    parser = (value) => JSON.parse(value),
  } = {},
) {
  // TODO need to make a hole
  return {
    toDOM: (node) => {
      console.log('holaaa', node);
      return [
        container,
        {
          'data-bangle-id': spec.name,
          'data-bangle-attrs': serializer(node),
        },
      ];
    },
    parseDOM: [
      {
        tag: `${container}[data-bangle-id="${spec.name}"]`,
        getAttrs: (dom) => {
          const attrs = dom.getAttribute('data-bangle-attrs');
          if (!attrs) {
            return {};
          }
          return parser(attrs);
        },
      },
    ],
  };
}
