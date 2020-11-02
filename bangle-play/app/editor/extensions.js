import Dinos from 'bangle-plugins/dinos';
import { History } from 'bangle-core/extensions';
import {
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
} from 'bangle-core/marks/index';
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
import { CollabExtension } from 'bangle-plugins/collab/client/collab-extension';
import { collabRequestHandlers } from 'bangle-plugins/collab/client/collab-request-handlers';
import { Emoji, EmojiInlineSuggest } from 'bangle-plugins/emoji/index';
import 'bangle-plugins/emoji/emoji.css';

import './extensions-override.css';
import { LinkMenu } from 'bangle-plugins/inline-menu/index';
import { FloatingMenu } from 'bangle-plugins/inline-menu/floating-menu';
import 'bangle-plugins/inline-menu/inline-menu.css';

const getScrollContainerDOM = (view) => {
  return view.dom.parentElement.parentElement;
};
// TODO Taking inputs liek this is not ideal, the extension
// list should be static, so that anyone can import them and get static values
export function extensions({
  collabOpts,
  inlineMenuComponent,
  switchOffShit,
} = {}) {
  const linkMenu = new LinkMenu({
    getScrollContainerDOM,
  });
  return [
    new EmojiInlineSuggest({
      getScrollContainerDOM,
    }),
    !switchOffShit &&
      new Link({
        openOnClick: true,
      }),
    !switchOffShit && new Bold(),
    !switchOffShit && new Code(),
    !switchOffShit && new Italic(),
    !switchOffShit && new Strike(),
    !switchOffShit && new Underline(),
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
    linkMenu,
    new FloatingMenu({ linkMenu }),

    collabOpts &&
      new CollabExtension({
        docName: collabOpts.docName,
        clientId: collabOpts.clientId,
        ...collabRequestHandlers((...args) =>
          // TODO fix this resp.body
          collabOpts.manager.handleRequest(...args).then((resp) => resp.body),
        ),
      }),
  ].filter(Boolean);
}
