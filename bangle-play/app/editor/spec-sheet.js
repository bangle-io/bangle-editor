import 'bangle-core/style.css';
import { coreSpec } from 'bangle-core/utils/core-components';
import * as collab from 'bangle-plugins/collab/client/collab-extension';
import { emoji } from 'bangle-plugins/emoji/index';
import 'bangle-plugins/emoji/emoji.css';
import 'bangle-react/menu/style.css';
import './extensions-override.css';
import { trailingNode } from 'bangle-plugins/trailing-node/index';
import { timestamp } from 'bangle-plugins/timestamp/index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { dino } from 'bangle-react/dino';
import { stopwatch } from 'bangle-react/stopwatch';
import { emojiSuggestMenu } from 'bangle-react/menu/index';

export const specSheet = new SpecSheet([
  ...coreSpec(),
  collab.spec(),
  emoji.spec(),
  emojiSuggestMenu.spec(),
  stopwatch.spec(),
  trailingNode.spec(),
  timestamp.spec(),
  dino.spec(),
]);
