import markdownIt from 'markdown-it';
import { MarkdownParser } from 'prosemirror-markdown';
import { todoListMarkdownItPlugin } from './todo-list-markdown-it-plugin';
import { doc, paragraph, text } from 'bangle-core/nodes/index';
import { schemaLoader } from 'bangle-core/element-loaders';

export const defaultMarkdownItTokenizer = markdownIt().use(
  todoListMarkdownItPlugin,
);

export function markdownParser(
  spec,
  markdownItTokenizer = defaultMarkdownItTokenizer,
  { useDefaults = true } = {},
) {
  const { schema, tokens } = markdownLoader(spec, { useDefaults });

  return new MarkdownParser(schema, markdownItTokenizer, tokens);
}

export function markdownLoader(editorSpec, { useDefaults }) {
  const tokens = Object.fromEntries(
    editorSpec
      .filter((e) => e.markdown?.parseMarkdown)
      .flatMap((e) => {
        return Object.entries(e.markdown.parseMarkdown);
      }),
  );
  const schema = schemaLoader(editorSpec);

  const nodeSerializer = Object.fromEntries(
    editorSpec
      .filter((spec) => spec.type === 'node' && spec.markdown?.toMarkdown)
      .map((spec) => {
        return [spec.name, spec.markdown.toMarkdown];
      }),
  );

  const markSerializer = Object.fromEntries(
    editorSpec
      .filter((spec) => spec.type === 'mark' && spec.markdown?.toMarkdown)
      .map((spec) => {
        return [spec.name, spec.markdown.toMarkdown];
      }),
  );

  return {
    tokens,
    schema,
    serializer: {
      node: nodeSerializer,
      mark: markSerializer,
    },
  };
}
