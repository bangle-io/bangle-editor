import { Mark, Node } from 'bangle-core/index';
import { objectFilter, objectMapValues } from 'bangle-core/utils/js-utils';
import { MarkdownSerializer } from 'prosemirror-markdown';
import { Paragraph, Text, Doc } from 'bangle-core/nodes/index';
// A markdown serializer which uses a node/mark schema's
// toMarkdown property to generate a markdown string
export const markdownSerializer = (extensions, { useDefaults = true } = {}) => {
  const { nodeSerializer, markSerializer } = getMarkdownSerializer(extensions, {
    useDefaults,
  });

  return new MarkdownSerializer(nodeSerializer, markSerializer);
};

function getMarkdownSerializer(extensions, { useDefaults }) {
  if (useDefaults) {
    extensions = [new Doc(), new Text(), new Paragraph(), ...extensions];
  }

  const nodeExtensions = Object.fromEntries(
    extensions
      .filter((e) => e instanceof Node)
      .map((r) => {
        if (r.toMarkdown) {
          return [r.name, r.toMarkdown];
        }
        if (r.markdown) {
          return [r.name, r.markdown.toMarkdown];
        }
        return null;
      })
      .filter(Boolean),
  );

  const markExtensions = Object.fromEntries(
    extensions
      .filter((e) => e instanceof Mark)
      .map((r) => {
        if (r.toMarkdown) {
          return [r.name, r.toMarkdown()];
        }
        if (r.markdown) {
          return [r.name, r.markdown.toMarkdown];
        }
        return null;
      })
      .filter(Boolean),
  );

  return {
    nodeSerializer: nodeExtensions,
    markSerializer: markExtensions,
  };
}

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
