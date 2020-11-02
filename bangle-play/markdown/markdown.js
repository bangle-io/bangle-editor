import * as markdown from 'bangle-plugins/markdown/index';
import { defaultMarkdownItTokenizer } from 'bangle-plugins/markdown/index';
import { emojiMarkdownItPlugin } from 'bangle-plugins/emoji/index';
import { editorSpec } from 'bangle-play/app/editor/editor-spec';

const parser = markdown.markdownParser(
  editorSpec,
  defaultMarkdownItTokenizer.use(emojiMarkdownItPlugin),
);

const serializer = markdown.markdownSerializer(editorSpec);

export const markdownParser = (markdownStr) => parser.parse(markdownStr);
export const markdownSerializer = (doc) => serializer.serialize(doc);
