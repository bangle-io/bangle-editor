import '@banglejs/core/style.css';
import '@banglejs/tooltip/style.css';

import * as collab from '@banglejs/collab/client/collab-extension';
import { emoji } from '@banglejs/emoji/index';
import '@banglejs/emoji/emoji.css';
import '@banglejs/react-menu/style.css';
import '@banglejs/markdown-front-matter/style.css';
import './extensions-override.css';
import { trailingNode } from '@banglejs/trailing-node';
import { timestamp } from '@banglejs/timestamp';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import stopwatch from '@banglejs/react-stopwatch';
import sticker from '@banglejs/react-sticker';
import { emojiSuggestMenu } from '@banglejs/react-menu';
import { markdownFrontMatter } from '@banglejs/markdown-front-matter';
import {
  bold,
  code,
  italic,
  strike,
  link,
  underline,
  doc,
  text,
  paragraph,
  blockquote,
  bulletList,
  codeBlock,
  hardBreak,
  heading,
  horizontalRule,
  listItem,
  orderedList,
  todoItem,
  todoList,
  image,
} from '@banglejs/core/components/index';

export const specRegistry = new SpecRegistry([
  doc.spec({ content: 'frontMatter? block+' }),
  text.spec(),
  paragraph.spec(),
  blockquote.spec(),
  bulletList.spec(),
  codeBlock.spec(),
  hardBreak.spec(),
  heading.spec(),
  horizontalRule.spec(),
  listItem.spec(),
  orderedList.spec(),
  todoItem.spec(),
  todoList.spec(),
  image.spec(),
  bold.spec(),
  code.spec(),
  italic.spec(),
  strike.spec(),
  link.spec(),
  underline.spec(),
  collab.spec(),
  emoji.spec(),
  emojiSuggestMenu.spec(),
  stopwatch.spec(),
  trailingNode.spec(),
  timestamp.spec(),
  sticker.spec(),
  markdownFrontMatter.spec(),
]);
