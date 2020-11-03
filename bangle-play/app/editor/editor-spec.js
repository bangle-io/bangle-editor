import { coreSpec } from 'bangle-core/components';
import * as collab from 'bangle-plugins/collab/client/collab-extension';
import { dinos } from 'bangle-plugins/dinos/index';
import { emoji, emojiInlineSuggest } from 'bangle-plugins/emoji/index';
import 'bangle-plugins/emoji/emoji.css';

import 'bangle-plugins/inline-menu/inline-menu.css';
import * as floatingMenu from 'bangle-plugins/inline-menu/floating-menu';
import * as linkMenu from 'bangle-plugins/inline-menu/link-menu';
import { stopwatch } from 'bangle-plugins/stopwatch/index';

import { config } from './config';
import { trailingNode } from 'bangle-plugins/trailing-node/index';
import { timestamp } from 'bangle-plugins/timestamp/index';
import { SpecSheet } from 'bangle-core/spec-sheet';

export const specSheet = new SpecSheet([
  ...coreSpec({ node: { heading: { levels: config.headingLevels } } }),
  collab.spec(),
  dinos.spec(),
  emoji.spec(),
  floatingMenu.spec(),
  linkMenu.spec(),
  emojiInlineSuggest.spec({ markName: 'emoji_inline_suggest', trigger: ':' }),
  stopwatch.spec(),
  trailingNode.spec(),
  timestamp.spec(),
]);
