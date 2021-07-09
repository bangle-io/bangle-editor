import { SpecRegistry } from '@bangle.dev/core';

export function markdownLoader(
  specRegistry = new SpecRegistry(),
  { useDefaults },
) {
  const tokens = Object.fromEntries(
    specRegistry.spec
      .filter((e) => e.markdown && e.markdown.parseMarkdown)
      .flatMap((e) => {
        return Object.entries(e.markdown.parseMarkdown);
      }),
  );

  const nodeSerializer = Object.fromEntries(
    specRegistry.spec
      .filter(
        (spec) =>
          spec.type === 'node' && spec.markdown && spec.markdown.toMarkdown,
      )
      .map((spec) => {
        return [spec.name, spec.markdown.toMarkdown];
      }),
  );

  const markSerializer = Object.fromEntries(
    specRegistry.spec
      .filter(
        (spec) =>
          spec.type === 'mark' && spec.markdown && spec.markdown.toMarkdown,
      )
      .map((spec) => {
        return [spec.name, spec.markdown.toMarkdown];
      }),
  );

  return {
    tokens,
    serializer: {
      node: nodeSerializer,
      mark: markSerializer,
    },
  };
}
