import { SpecRegistry } from '@banglejs/core/spec-registry';
import markdownIt from 'markdown-it';
import { MarkdownParser } from 'prosemirror-markdown';
import { todoListMarkdownItPlugin } from './todo-list-markdown-it-plugin';

export const defaultMarkdownItTokenizer = markdownIt().use(
  todoListMarkdownItPlugin,
);

export function markdownParser(
  specRegistry = new SpecRegistry(),
  markdownItTokenizer = defaultMarkdownItTokenizer,
  { useDefaults = true } = {},
) {
  const { tokens } = markdownLoader(specRegistry, { useDefaults });

  return new MarkdownParser(specRegistry.schema, markdownItTokenizer, tokens);
}

export function markdownLoader(
  specRegistry = new SpecRegistry(),
  { useDefaults },
) {
  const tokens = Object.fromEntries(
    specRegistry.spec
      .filter((e) => e.markdown?.parseMarkdown)
      .flatMap((e) => {
        return Object.entries(e.markdown.parseMarkdown);
      }),
  );

  const nodeSerializer = Object.fromEntries(
    specRegistry.spec
      .filter((spec) => spec.type === 'node' && spec.markdown?.toMarkdown)
      .map((spec) => {
        return [spec.name, spec.markdown.toMarkdown];
      }),
  );

  const markSerializer = Object.fromEntries(
    specRegistry.spec
      .filter((spec) => spec.type === 'mark' && spec.markdown?.toMarkdown)
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
