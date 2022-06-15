import {
  BaseRawMarkSpec,
  BaseRawNodeSpec,
  SpecRegistry,
} from '@bangle.dev/core';

export function markdownLoader(specRegistry = new SpecRegistry()) {
  const tokens: { [key: string]: any } = Object.fromEntries(
    specRegistry.spec
      .filter((e) => e.markdown && e.markdown.parseMarkdown)
      .flatMap((e) => {
        return Object.entries(e.markdown?.parseMarkdown || {});
      }),
  );

  let nodeSerializer: {
    [k: string]: NonNullable<BaseRawNodeSpec['markdown']>['toMarkdown'];
  } = {};

  for (const spec of specRegistry.spec) {
    if (spec.type === 'node' && spec.markdown?.toMarkdown) {
      nodeSerializer[spec.name] = spec.markdown.toMarkdown;
    }
  }

  let markSerializer: {
    [k: string]: NonNullable<BaseRawMarkSpec['markdown']>['toMarkdown'];
  } = {};

  for (const spec of specRegistry.spec) {
    if (spec.type === 'mark' && spec.markdown?.toMarkdown) {
      markSerializer[spec.name] = spec.markdown.toMarkdown;
    }
  }

  return {
    tokens,
    serializer: {
      node: nodeSerializer,
      mark: markSerializer,
    },
  };
}
