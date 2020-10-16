import { Mark, Node } from 'bangle-core/index';
import { objectFilter, objectMapValues } from 'bangle-core/utils/js-utils';
import { MarkdownSerializer } from 'prosemirror-markdown';
import { Paragraph, Text, Doc } from 'bangle-core/nodes/index';
// A markdown serializer which uses a node/mark schema's
// toMarkdown property to generate a markdown string
export const markdownSerializer = (node, mark) => {
  return new MarkdownSerializer(node, mark);
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

export function getMarkdownSerializer(extensions, { useDefaults = true } = {}) {
  if (useDefaults) {
    extensions = [new Doc(), new Text(), new Paragraph(), ...extensions];
  }
  const nodeExtensions = Object.fromEntries(
    extensions
      .filter((e) => e instanceof Node)
      .filter((r) => r.toMarkdown)
      .map((r) => [r.name, r.toMarkdown]),
  );
  const markExtensions = Object.fromEntries(
    extensions
      .filter((e) => e instanceof Mark)
      .filter((r) => r.toMarkdown)
      .map((r) => [r.name, r.toMarkdown()]),
  );

  return {
    nodeSerializer: nodeExtensions,
    markSerializer: markExtensions,
  };
}
