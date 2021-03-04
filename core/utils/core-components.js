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

export function coreSpec() {
  return [...coreMarkSpec(), ...coreNodeSpec()];
}

export function corePlugins() {
  return [
    bold.plugins(),
    code.plugins(),
    italic.plugins(),
    strike.plugins(),
    link.plugins(),
    underline.plugins(),
    paragraph.plugins(),
    blockquote.plugins(),
    bulletList.plugins(),
    codeBlock.plugins(),
    hardBreak.plugins(),
    heading.plugins(),
    horizontalRule.plugins(),
    listItem.plugins(),
    orderedList.plugins(),
    image.plugins(),
    history.plugins(),
  ];
}

function coreMarkSpec() {
  return [
    bold.spec(),
    code.spec(),
    italic.spec(),
    strike.spec(),
    link.spec(),
    underline.spec(),
  ];
}

function coreNodeSpec() {
  return [
    doc.spec(),
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
    image.spec(),
  ];
}
