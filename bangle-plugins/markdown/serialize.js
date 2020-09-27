import { MarkdownSerializer } from 'prosemirror-markdown';

// A markdown serializer which uses a node/mark schema's
// toMarkdown property to generate a markdown string
export const markdownSerializer = (
  schema,
  nodeOverrides = {}, // Object<string, function>
  markdownOverrides = {}, // Object<string, function>
) => {
  return new MarkdownSerializer(
    proxyNodesToMarkdown(nodeOverrides, schema),
    proxyMarksToMarkdown(markdownOverrides, schema),
    schema,
  );
};

function proxyNodesToMarkdown(obj, schema) {
  let handler = {
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
  let handler = {
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
