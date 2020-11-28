import 'bangle-core/style.css';
import { coreSpec } from 'bangle-core/utils/core-components';
import * as collab from 'bangle-plugins/collab/client/collab-extension';
import { emoji } from 'bangle-plugins/emoji/index';
import 'bangle-plugins/emoji/emoji.css';
import 'bangle-react/menu/style.css';
import './extensions-override.css';
import { trailingNode } from 'bangle-plugins/trailing-node/index';
import { timestamp } from 'bangle-plugins/timestamp/index';
import { SpecRegistry } from 'bangle-core/spec-registry';
import stopwatch from '@banglejs/stopwatch';
import sticker from '@banglejs/sticker';
import { emojiSuggestMenu } from 'bangle-react/menu/index';

export const specRegistry = new SpecRegistry([
  ...coreSpec(),
  collab.spec(),
  emoji.spec(),
  emojiSuggestMenu.spec(),
  stopwatch.spec(),
  trailingNode.spec(),
  timestamp.spec(),
  sticker.spec(),
]);
