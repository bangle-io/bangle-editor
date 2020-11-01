import * as doc from './doc';
import * as paragraph from './paragraph';
import * as text from './text';
import * as blockquote from './blockquote';
import * as bulletList from './bullet-list';
import * as codeBlock from './code-block';
import * as hardBreak from './hard-break';
import * as heading from './heading';
import * as horizontalRule from './horizontal-rule';
import * as listItem from './list-item/list-item';
import * as orderedList from './ordered-list';
import * as todoItem from './todo-item';
import * as todoList from './todo-list';
import * as image from './image';

export * as doc from './doc';
export * as paragraph from './paragraph';
export * as text from './text';
export * as blockquote from './blockquote';
export * as bulletList from './bullet-list';
export * as codeBlock from './code-block';
export * as hardBreak from './hard-break';
export * as heading from './heading';
export * as horizontalRule from './horizontal-rule';
export * as listItem from './list-item/list-item';
export * as orderedList from './ordered-list';
export * as todoItem from './todo-item';
export * as todoList from './todo-list';
export * as image from './image';

export function coreNodeSpec(options = {}) {
  return [
    doc.spec(options.doc),
    text.spec(options.text),
    paragraph.spec(options.paragraph),
    blockquote.spec(options.blockquote),
    bulletList.spec(options.bulletList),
    codeBlock.spec(options.codeBlock),
    hardBreak.spec(options.hardBreak),
    heading.spec(options.heading),
    horizontalRule.spec(options.horizontalRule),
    listItem.spec(options.listItem),
    orderedList.spec(options.orderedList),
    todoItem.spec(options.todoItem),
    todoList.spec(options.todoList),
    image.spec(options.image),
  ];
}

export function coreNodePlugins(options = {}) {
  return [
    doc.plugins(options.doc),
    paragraph.plugins(options.paragraph),
    text.plugins(options.text),
    blockquote.plugins(options.blockquote),
    bulletList.plugins(options.bulletList),
    codeBlock.plugins(options.codeBlock),
    hardBreak.plugins(options.hardBreak),
    heading.plugins(options.heading),
    horizontalRule.plugins(options.horizontalRule),
    listItem.plugins(options.listItem),
    orderedList.plugins(options.orderedList),
    todoItem.plugins(options.todoItem),
    todoList.plugins(options.todoList),
    image.plugins(options.image),
  ];
}
