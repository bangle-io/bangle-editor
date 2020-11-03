/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { markdownSerializer } from '../markdown-serializer';

import {
  bold,
  code,
  italic,
  link,
  strike,
  underline,
  doc,
  paragraph,
  text,
  bulletList,
  heading,
  blockquote,
  codeBlock,
  hardBreak,
  listItem,
  orderedList,
  todoItem,
  todoList,
  image,
  horizontalRule,
} from 'bangle-core/components';

import { markdownParser } from '../markdown-parser';
import { SpecSheet } from 'bangle-core/spec-sheet';

const specSheet = new SpecSheet([
  // nodes
  doc.spec(),
  paragraph.spec(),
  text.spec(),

  bulletList.spec(),
  heading.spec(),
  blockquote.spec(),
  codeBlock.spec(),
  hardBreak.spec(),
  listItem.spec(),
  orderedList.spec(),
  todoItem.spec(),
  todoList.spec(),
  image.spec(),
  horizontalRule.spec(),

  // marks
  bold.spec(),
  code.spec(),
  italic.spec(),
  link.spec(),
  strike.spec(),
  underline.spec(),
]);

const serializer = markdownSerializer(specSheet);
const parser = markdownParser(specSheet);

export const serialize = async (doc) => {
  let content = doc;
  if (typeof doc === 'function') {
    content = doc(specSheet.schema);
  }
  return serializer.serialize(content);
};

export const parse = async (md) => parser.parse(md);
