import '../setup/entry.css';
import { defaultPlugins } from '@banglejs/core/test-helpers/default-components';
import * as prosemirrorView from '@banglejs/core/prosemirror/view';
import { setupReactEditor } from '../setup/entry-helpers';

window.prosemirrorView = prosemirrorView;

setup();

function setup() {
  window.commands = {};

  const plugins = () => [...defaultPlugins()];

  setupReactEditor({ id: 'pm-root', plugins });
}
