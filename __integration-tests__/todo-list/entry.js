import '../setup/entry.css';
import { defaultPlugins } from '@bangle.dev/core/test-helpers/default-components';
import {
  __serializeForClipboard,
  __parseFromClipboard,
} from '@bangle.dev/core/prosemirror/view';
import { setupReactEditor } from '../setup/entry-helpers';

window.__serializeForClipboard = __serializeForClipboard;
window.__parseFromClipboard = __parseFromClipboard;

setup();

function setup() {
  window.commands = {};

  const plugins = () => [...defaultPlugins()];

  setupReactEditor({ id: 'pm-root', plugins });
}
