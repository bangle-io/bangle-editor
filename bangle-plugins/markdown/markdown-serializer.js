import { objectFilter, objectMapValues } from 'bangle-core/utils/js-utils';
import { MarkdownSerializer } from 'prosemirror-markdown';
import { markdownLoader } from './markdown-parser';
// A markdown serializer which uses a node/mark schema's
// toMarkdown property to generate a markdown string
export const markdownSerializer = (
  specRegistry,
  { useDefaults = true } = {},
) => {
  const { serializer } = markdownLoader(specRegistry, { useDefaults });

  return new MarkdownSerializer(serializer.node, serializer.mark);
};

export function serializeAtomNodeToMdLink(name, attrs) {
  const data = objectFilter(attrs, (val, key) => {
    return key.startsWith('data-');
  });

  const string = new URLSearchParams(
    objectMapValues(data, (val) => {
      // convert it to string for predictability when parsing different types
      return JSON.stringify(val);
    }),
  );

  return `[$${name}](bangle://${string})`;
}
