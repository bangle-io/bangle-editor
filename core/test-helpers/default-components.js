import {
  history,
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

export function defaultSpecs(opts = {}) {
  return [...coreMarkSpec(opts), ...coreNodeSpec(opts)];
}

export function defaultPlugins(opts = {}) {
  return [
    ...coreMarkPlugins(opts),
    ...coreNodePlugins(opts),
    history.plugins(opts.history),
  ];
}

function coreMarkSpec(options = {}) {
  return [
    bold.spec(options.bold),
    code.spec(options.code),
    italic.spec(options.italic),
    strike.spec(options.strike),
    link.spec(options.link),
    underline.spec(options.underline),
  ];
}

function coreMarkPlugins(options = {}) {
  return [
    bold.plugins(options.bold),
    code.plugins(options.code),
    italic.plugins(options.italic),
    strike.plugins(options.strike),
    link.plugins(options.link),
    underline.plugins(options.underline),
  ];
}

function coreNodeSpec(options = {}) {
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

function coreNodePlugins(options = {}) {
  return [
    paragraph.plugins(options.paragraph),
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
