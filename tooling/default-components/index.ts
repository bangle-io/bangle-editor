import {
  blockquote,
  bold,
  bulletList,
  code,
  codeBlock,
  doc,
  hardBreak,
  heading,
  history,
  horizontalRule,
  image,
  italic,
  link,
  listItem,
  orderedList,
  paragraph,
  strike,
  text,
  underline,
} from '@bangle.dev/core-components';

export function defaultSpecs(opts = {}) {
  return [...coreMarkSpec(opts), ...coreNodeSpec(opts)];
}

export function defaultPlugins(opts: any = {}) {
  return [
    ...coreMarkPlugins(opts),
    ...coreNodePlugins(opts),
    history.plugins(opts.history),
  ];
}

export function options(options: any = {}) {
  return [
    ...coreMarkPlugins(options),
    ...coreNodePlugins(options),
    history.plugins(options.history),
  ];
}

function coreMarkSpec(options: any = {}) {
  return [
    options.bold !== false && (bold.spec as any)(options.bold),
    options.code !== false && (code.spec as any)(options.code),
    options.italic !== false && (italic.spec as any)(options.italic),
    options.strike !== false && (strike.spec as any)(options.strike),
    options.link !== false && (link.spec as any)(options.link),
    options.underline !== false && (underline.spec as any)(options.underline),
  ];
}

function coreMarkPlugins(options: any = {}) {
  return [
    options.bold !== false && (bold.plugins as any)(options.bold),
    options.code !== false && (code.plugins as any)(options.code),
    options.italic !== false && (italic.plugins as any)(options.italic),
    options.strike !== false && (strike.plugins as any)(options.strike),
    options.link !== false && (link.plugins as any)(options.link),
    options.underline !== false &&
      (underline.plugins as any)(options.underline),
  ];
}

function coreNodeSpec(options: any = {}) {
  return [
    options.doc !== false && (doc.spec as any)(options.doc),
    options.text !== false && (text.spec as any)(options.text),
    options.paragraph !== false && (paragraph.spec as any)(options.paragraph),
    options.blockquote !== false &&
      (blockquote.spec as any)(options.blockquote),
    options.bulletList !== false &&
      (bulletList.spec as any)(options.bulletList),
    options.codeBlock !== false && (codeBlock.spec as any)(options.codeBlock),
    options.hardBreak !== false && (hardBreak.spec as any)(options.hardBreak),
    options.heading !== false && (heading.spec as any)(options.heading),
    options.horizontalRule !== false &&
      (horizontalRule.spec as any)(options.horizontalRule),
    options.listItem !== false && (listItem.spec as any)(options.listItem),
    options.orderedList !== false &&
      (orderedList.spec as any)(options.orderedList),
    options.image !== false && (image.spec as any)(options.image),
  ];
}

function coreNodePlugins(options: any = {}) {
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
