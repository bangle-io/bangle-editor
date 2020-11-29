import * as markdown from '@banglejs/markdown/index';
import { defaultMarkdownItTokenizer } from '@banglejs/markdown/index';
import { emojiMarkdownItPlugin } from '@banglejs/emoji/index';
import { specRegistry } from 'bangle-play/app/editor/spec-sheet';

const parser = markdown.markdownParser(
  specRegistry,
  defaultMarkdownItTokenizer.use(emojiMarkdownItPlugin),
);

const serializer = markdown.markdownSerializer(specRegistry);

export const markdownParser = (markdownStr) => parser.parse(markdownStr);
export const markdownSerializer = (doc) => serializer.serialize(doc);
