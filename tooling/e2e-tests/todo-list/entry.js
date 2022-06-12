import '../setup/entry.css';

import {
  __parseFromClipboard,
  __serializeForClipboard,
} from 'prosemirror-view';

import { defaultPlugins } from '@bangle.dev/all-base-components';

import { setupReactEditor } from '../setup/entry-helpers';

window.__serializeForClipboard = __serializeForClipboard;
window.__parseFromClipboard = __parseFromClipboard;

setup();

function setup() {
  window.commands = {};

  const plugins = () => [...defaultPlugins()];

  setupReactEditor({ id: 'pm-root', plugins });
}
