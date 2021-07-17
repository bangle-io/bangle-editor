import { SpecRegistry } from '@bangle.dev/core';
import markdownIt from 'markdown-it';
import { MarkdownParser } from 'prosemirror-markdown';
import { markdownLoader } from './markdown-loader';
import { tableMarkdownItPlugin } from './table-markdown-it-plugin';
import { todoListMarkdownItPlugin } from './todo-list-markdown-it-plugin';

export const defaultMarkdownItTokenizer = markdownIt()
  .use(todoListMarkdownItPlugin)
  .use(tableMarkdownItPlugin);

export function markdownParser(
  specRegistry = new SpecRegistry(),
  markdownItTokenizer = defaultMarkdownItTokenizer,
) {
  const { tokens } = markdownLoader(specRegistry);
  return new MarkdownParser(specRegistry.schema, markdownItTokenizer, tokens);
}
