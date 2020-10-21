import Dinos from 'bangle-plugins/dinos';
import { History } from 'bangle-core/extensions';
import { Bold, Code, Italic, Link, Strike, Underline } from 'bangle-core/marks';
import {
  Blockquote,
  BulletList,
  CodeBlock,
  HardBreak,
  Heading,
  HorizontalRule,
  ListItem,
  OrderedList,
  TodoItem,
  TodoList,
  Image,
} from 'bangle-core/nodes/index';
import StopwatchExtension from 'bangle-plugins/stopwatch/stopwatch';
import { Timestamp } from 'bangle-plugins/timestamp';
import { TrailingNode } from 'bangle-plugins/trailing-node';
import { SelectionTooltip } from 'bangle-plugins/selection-tooltip/index';
import { CollabExtension } from 'bangle-plugins/collab/client/collab-extension';
import { collabRequestHandlers } from 'bangle-plugins/collab/client/collab-request-handlers';
import { inlineMenu } from './inline-menu/inline-menu';
import { InlineSuggest } from 'bangle-plugins/inline-suggest/index';
import { Emoji, EmojiInlineSuggest } from 'bangle-plugins/emoji/index';
import 'bangle-plugins/emoji/emoji.css';
import 'bangle-plugins/selection-tooltip/selection-tooltip.css';

import './extensions-override.css';

// TODO Taking inputs liek this is not ideal, the extension
// list should be static, so that anyone can import them and get static values
export function extensions({ collabOpts, inlineMenuDOM } = {}) {
  return [
    new EmojiInlineSuggest({
      getScrollContainerDOM: (view) => {
        return view.dom.parentElement.parentElement;
      },
    }),
    new Bold(),
    new Code(),
    new Italic(),
    new Link(),
    new Strike(),
    new Underline(),
    new Blockquote(),
    new BulletList(),
    new CodeBlock(),
    new HardBreak(),
    new Heading({
      levels: [1, 2, 3],
    }),
    new HorizontalRule(),
    new ListItem(),
    new TodoItem(),
    new TodoList(),
    new OrderedList(),
    new Image(),
    new Dinos(),
    new Emoji(),
    new History(),
    new TrailingNode(),
    new StopwatchExtension(),
    new Timestamp(),
    collabOpts &&
      new CollabExtension({
        docName: collabOpts.docName,
        clientId: collabOpts.clientId,
        ...collabRequestHandlers((...args) =>
          // TODO fix this resp.body
          collabOpts.manager.handleRequest(...args).then((resp) => resp.body),
        ),
      }),
    inlineMenuDOM
      ? inlineMenu(inlineMenuDOM)
      : new SelectionTooltip({
          tooltipContent: (view) => {
            const tooltipContent = document.createElement('div');
            tooltipContent.textContent = 'hello world';
            return tooltipContent;
          },
        }),
    new InlineSuggest({
      trigger: '/',
      getScrollContainerDOM: (view) => {
        return view.dom.parentElement.parentElement;
      },
    }),
  ].filter(Boolean);
}
