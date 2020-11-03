import { SpecSheet } from 'bangle-core/spec-sheet';
import markdownIt from 'markdown-it';
import { MarkdownParser } from 'prosemirror-markdown';
import { todoListMarkdownItPlugin } from './todo-list-markdown-it-plugin';

export const defaultMarkdownItTokenizer = markdownIt().use(
  todoListMarkdownItPlugin,
);

export function markdownParser(
  specSheet = new SpecSheet(),
  markdownItTokenizer = defaultMarkdownItTokenizer,
  { useDefaults = true } = {},
) {
  const { tokens } = markdownLoader(specSheet, { useDefaults });

  return new MarkdownParser(specSheet.schema, markdownItTokenizer, tokens);
}

export function markdownLoader(specSheet = new SpecSheet(), { useDefaults }) {
  const tokens = Object.fromEntries(
    specSheet.spec
      .filter((e) => e.markdown?.parseMarkdown)
      .flatMap((e) => {
        return Object.entries(e.markdown.parseMarkdown);
      }),
  );

  const nodeSerializer = Object.fromEntries(
    specSheet.spec
      .filter((spec) => spec.type === 'node' && spec.markdown?.toMarkdown)
      .map((spec) => {
        return [spec.name, spec.markdown.toMarkdown];
      }),
  );

  const markSerializer = Object.fromEntries(
    specSheet.spec
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
