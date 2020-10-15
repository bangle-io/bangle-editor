import { Mark, Node } from 'bangle-core/index';
import { objectFilter, objectMapValues } from 'bangle-core/utils/js-utils';
import { MarkdownSerializer } from 'prosemirror-markdown';

// A markdown serializer which uses a node/mark schema's
// toMarkdown property to generate a markdown string
export const markdownSerializer = (
  schema,
  extensions,
  nodeOverrides = {}, // Object<string, function>
  markdownOverrides = {}, // Object<string, function>
) => {
  const { node, mark } = getMarkdownSerializers(extensions);
  debugger;
  return new MarkdownSerializer(node, mark, schema);
};

function proxyNodesToMarkdown(obj, schema) {
  const handler = {
    get(target, propKey, receiver) {
      const override = Reflect.get(target, propKey, receiver);
      if (override) {
        return override;
      }

      if (schema.nodes[propKey]) {
        if (schema.nodes[propKey].spec?.toMarkdown) {
          return schema.nodes[propKey].spec?.toMarkdown;
        }
      }

      return undefined;
    },
  };
  return new Proxy(obj, handler);
}

function proxyMarksToMarkdown(obj, schema) {
  const handler = {
    get(target, propKey, receiver) {
      const override = Reflect.get(target, propKey, receiver);
      if (override) {
        return override();
      }

      if (schema.marks[propKey]) {
        if (schema.marks[propKey].spec?.toMarkdown) {
          return schema.marks[propKey].spec?.toMarkdown();
        }
      }

      return undefined;
    },
  };
  return new Proxy(obj, handler);
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

function getMarkdownSerializers(extensions) {
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
    node: nodeExtensions,
    mark: markExtensions,
  };
}
