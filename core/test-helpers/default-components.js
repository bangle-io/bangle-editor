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
  image,
} from '../components/index';

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
    options.bold !== false && bold.spec(options.bold),
    options.code !== false && code.spec(options.code),
    options.italic !== false && italic.spec(options.italic),
    options.strike !== false && strike.spec(options.strike),
    options.link !== false && link.spec(options.link),
    options.underline !== false && underline.spec(options.underline),
  ];
}

function coreMarkPlugins(options = {}) {
  return [
    options.bold !== false && bold.plugins(options.bold),
    options.code !== false && code.plugins(options.code),
    options.italic !== false && italic.plugins(options.italic),
    options.strike !== false && strike.plugins(options.strike),
    options.link !== false && link.plugins(options.link),
    options.underline !== false && underline.plugins(options.underline),
  ];
}

function coreNodeSpec(options = {}) {
  return [
    options.doc !== false && doc.spec(options.doc),
    options.text !== false && text.spec(options.text),
    options.paragraph !== false && paragraph.spec(options.paragraph),
    options.blockquote !== false && blockquote.spec(options.blockquote),
    options.bulletList !== false && bulletList.spec(options.bulletList),
    options.codeBlock !== false && codeBlock.spec(options.codeBlock),
    options.hardBreak !== false && hardBreak.spec(options.hardBreak),
    options.heading !== false && heading.spec(options.heading),
    options.horizontalRule !== false &&
      horizontalRule.spec(options.horizontalRule),
    options.listItem !== false && listItem.spec(options.listItem),
    options.orderedList !== false && orderedList.spec(options.orderedList),
    options.image !== false && image.spec(options.image),
  ];
}

function coreNodePlugins(options = {}) {
  return [
    options.paragraph !== false && paragraph.plugins(options.paragraph),
    options.blockquote !== false && blockquote.plugins(options.blockquote),
    options.bulletList !== false && bulletList.plugins(options.bulletList),
    options.codeBlock !== false && codeBlock.plugins(options.codeBlock),
    options.hardBreak !== false && hardBreak.plugins(options.hardBreak),
    options.heading !== false && heading.plugins(options.heading),
    options.horizontalRule !== false &&
      horizontalRule.plugins(options.horizontalRule),
    options.listItem !== false && listItem.plugins(options.listItem),
    options.orderedList !== false && orderedList.plugins(options.orderedList),
    options.image !== false && image.plugins(options.image),
  ];
}
