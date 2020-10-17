import markdownIt from 'markdown-it';
import { MarkdownParser } from 'prosemirror-markdown';
import { todoListMarkdownItPlugin } from './todo-list-markdown-it-plugin';
import { Paragraph, Text, Doc } from 'bangle-core/nodes/index';

export const defaultMarkdownItTokenizer = markdownIt().use(
  todoListMarkdownItPlugin,
);

export function markdownParser(
  extensions,
  schema,
  markdownItTokenizer = defaultMarkdownItTokenizer,
  { useDefaults = true } = {},
) {
  if (useDefaults) {
    extensions = [new Doc(), new Text(), new Paragraph(), ...extensions];
  }

  const tokens = Object.fromEntries(
    extensions
      .filter((e) => e.markdown?.parseMarkdown)
      .flatMap((e) => {
        return Object.entries(e.markdown.parseMarkdown);
      }),
  );

  return new MarkdownParser(schema, markdownItTokenizer, tokens);
}
