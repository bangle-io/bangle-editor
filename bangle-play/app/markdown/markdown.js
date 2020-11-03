import * as markdown from 'bangle-plugins/markdown/index';
import { defaultMarkdownItTokenizer } from 'bangle-plugins/markdown/index';
import { emojiMarkdownItPlugin } from 'bangle-plugins/emoji/index';
import { specSheet } from 'bangle-play/app/editor/editor-spec';

const parser = markdown.markdownParser(
  specSheet,
  defaultMarkdownItTokenizer.use(emojiMarkdownItPlugin),
);

const serializer = markdown.markdownSerializer(specSheet);

export const markdownParser = (markdownStr) => parser.parse(markdownStr);
export const markdownSerializer = (doc) => serializer.serialize(doc);
