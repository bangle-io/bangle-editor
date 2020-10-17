import { extensions } from '../app/editor/extensions';
import * as markdown from 'bangle-plugins/markdown/index';
import { getSchema } from 'bangle-play/app/editor/utils';
import { defaultMarkdownItTokenizer } from 'bangle-plugins/markdown/index';
import { emojiMarkdownItPlugin } from 'bangle-plugins/emoji/emoji-markdown-it-plugin';

// TODO this is ugly read up about the static extensions though piece
const exts = extensions();
const schema = getSchema(exts);
const parser = markdown.markdownParser(
  extensions(),
  schema,
  defaultMarkdownItTokenizer.use(emojiMarkdownItPlugin),
);
const serializer = markdown.markdownSerializer(extensions());

export const markdownParser = (markdownStr) => parser.parse(markdownStr);
export const markdownSerializer = (doc) => serializer.serialize(doc);
