import {
  bangleWarn,
  objectFilter,
  objectMapValues,
} from 'bangle-core/utils/js-utils';

export function nodeView() {}

/**
 * Generates a toDOM method for you, serializes any attr
 * starting with `data-`.
 *
 * @param {*} spec
 * @param {Object} opts
 * @param {string} opts.container
 */
export function serializationHelpers(
  spec,
  {
    container = spec.schema.inline ? 'span' : 'div',
    serializer = (value, key) => JSON.stringify(value),
    parser = (value, key) => JSON.parse(value),
  } = {},
) {
  const serializableAttrs = (node) =>
    objectFilter(node.attrs, (value, key) => {
      return key.startsWith('data-');
    });
  // TODO implement with holes
  // TODO move to data-name
  return {
    toDOM: (node) => {
      if (!node.attrs['data-type']) {
        bangleWarn(node);
        throw new Error('Must have data-type');
      }
      return [container, objectMapValues(serializableAttrs(node), serializer)];
    },
    parseDOM: [
      {
        tag: `${container}[data-type="${serializer(spec.name, 'data-type')}"]`,
        getAttrs: (dom) => {
          return Object.fromEntries(
            Array.from(dom.attributes)
              .filter((attr) => {
                return attr.nodeName.startsWith('data-');
              })
              .map((attr) => {
                return [attr.nodeName, parser(attr.nodeValue, attr.nodeName)];
              }),
          );
        },
      },
    ],
  };
}
