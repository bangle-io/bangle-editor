/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { components, SpecRegistry } from '@bangle.dev/core';
import { table, tableCell, tableHeader, tableRow } from '@bangle.dev/table';
import { markdownParser } from '../markdown-parser';
import { markdownSerializer } from '../markdown-serializer';

const {
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
  image,
  horizontalRule,
} = components;
const specRegistry = new SpecRegistry([
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
  image.spec(),
  horizontalRule.spec(),

  // table nodes
  table,
  tableCell,
  tableHeader,
  tableRow,

  // marks
  bold.spec(),
  code.spec(),
  italic.spec(),
  link.spec(),
  strike.spec(),
  underline.spec(),
]);

const serializer = markdownSerializer(specRegistry);
const parser = markdownParser(specRegistry);

export const serialize = async (doc) => {
  let content = doc;
  if (typeof doc === 'function') {
    content = doc(specRegistry.schema);
  }
  return serializer.serialize(content);
};

export const parse = async (md) => {
  return parser.parse(md);
};
