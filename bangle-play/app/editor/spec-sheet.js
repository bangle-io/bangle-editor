import '@banglejs/core/style.css';
import { coreSpec } from '@banglejs/core/utils/core-components';
import * as collab from 'bangle-plugins/collab/client/collab-extension';
import { emoji } from 'bangle-plugins/emoji/index';
import 'bangle-plugins/emoji/emoji.css';
import '@banglejs/react-menu/style.css';
import './extensions-override.css';
import { trailingNode } from 'bangle-plugins/trailing-node/index';
import { timestamp } from 'bangle-plugins/timestamp/index';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import stopwatch from '@banglejs/react-stopwatch';
import sticker from '@banglejs/react-sticker';
import { emojiSuggestMenu } from '@banglejs/react-menu';

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
