// marks
import * as bold from './bold';
import * as code from './code';
import * as italic from './italic';
import * as link from './link';
import * as strike from './strike';
import * as underline from './underline';

// nodes
import * as blockquote from './blockquote';
import * as bulletList from './bullet-list';
import * as codeBlock from './code-block';
import * as hardBreak from './hard-break';
import * as heading from './heading';
import * as horizontalRule from './horizontal-rule';
import * as listItem from './list-item/list-item-component';
import * as orderedList from './ordered-list';
import * as image from './image';

import { criticalComponents } from '@bangle.dev/core';

const { doc, paragraph, text, history, editorStateCounter } =
  criticalComponents;

export {
  bold,
  code,
  italic,
  link,
  strike,
  underline,
  doc,
  paragraph,
  text,
  blockquote,
  bulletList,
  codeBlock,
  hardBreak,
  heading,
  horizontalRule,
  listItem,
  orderedList,
  image,
  history,
  editorStateCounter,
};
