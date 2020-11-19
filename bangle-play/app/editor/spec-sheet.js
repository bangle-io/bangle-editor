import 'bangle-core/style.css';
import { coreSpec } from 'bangle-core/components';
import * as collab from 'bangle-plugins/collab/client/collab-extension';
import { emoji, emojiInlineSuggest } from 'bangle-plugins/emoji/index';
import 'bangle-plugins/emoji/emoji.css';
// import 'bangle-react/inline-menu/inline-menu.css';
import 'bangle-react/menu/style.css';

import { config } from './config';
import { trailingNode } from 'bangle-plugins/trailing-node/index';
import { timestamp } from 'bangle-plugins/timestamp/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { dino } from 'bangle-react/dino';
import { stopwatch } from 'bangle-react/stopwatch';

export const specSheet = new SpecSheet([
  ...coreSpec({ heading: { levels: config.headingLevels } }),
  collab.spec(),
  emoji.spec(),
  emojiInlineSuggest.spec({ markName: 'emoji_inline_suggest', trigger: ':' }),
  stopwatch.spec(),
  trailingNode.spec(),
  timestamp.spec(),
  dino.spec(),
]);
